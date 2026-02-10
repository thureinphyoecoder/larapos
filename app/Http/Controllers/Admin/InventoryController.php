<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\ShopStockShare;
use App\Models\StockTransfer;
use App\Services\Governance\AuditLogger;
use App\Services\Governance\StockMovementLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function __construct(
        private readonly StockMovementLogger $stockMovementLogger,
        private readonly AuditLogger $auditLogger,
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'sales']), 403);
        $q = trim((string) $request->get('q', ''));
        $shopId = $request->integer('shop_id');
        $lowStockOnly = $request->boolean('low_stock');

        $variantsQuery = ProductVariant::with(['product.shop', 'product.brand', 'product.category'])
            ->where('is_active', true)
            ->orderBy('stock_level')
            ->orderByDesc('id');

        if (!$user->hasRole('admin')) {
            $variantsQuery->whereHas('product', fn ($q) => $q->where('shop_id', $user->shop_id));
        } elseif ($shopId > 0) {
            $variantsQuery->whereHas('product', fn ($query) => $query->where('shop_id', $shopId));
        }

        if ($lowStockOnly) {
            $variantsQuery->where('stock_level', '<=', 5);
        }

        if ($q !== '') {
            $variantsQuery->where(function ($query) use ($q) {
                $query->where('sku', 'like', "%{$q}%")
                    ->orWhereHas('product', function ($productQuery) use ($q) {
                        $productQuery->where('name', 'like', "%{$q}%")
                            ->orWhere('sku', 'like', "%{$q}%")
                            ->orWhereHas('brand', fn ($brandQuery) => $brandQuery->where('name', 'like', "%{$q}%"))
                            ->orWhereHas('category', fn ($catQuery) => $catQuery->where('name', 'like', "%{$q}%"))
                            ->orWhereHas('shop', fn ($shopQuery) => $shopQuery->where('name', 'like', "%{$q}%"));
                    });
            });
        }

        $variants = $variantsQuery->paginate(30)->withQueryString();

        $transferQuery = StockTransfer::with(['sourceVariant.product', 'destinationVariant.product', 'fromShop', 'toShop', 'initiator'])
            ->latest();

        if (!$user->hasRole('admin')) {
            $transferQuery->where(function ($q) use ($user) {
                $q->where('from_shop_id', $user->shop_id)
                    ->orWhere('to_shop_id', $user->shop_id);
            });
        }

        $transfers = $transferQuery->take(30)->get();

        $shops = Shop::orderBy('name')->get(['id', 'name']);

        $sharesQuery = ShopStockShare::with(['fromShop', 'toShop'])->latest();
        if (!$user->hasRole('admin')) {
            $sharesQuery->where('from_shop_id', $user->shop_id);
        }

        return Inertia::render('Admin/Inventory/Index', [
            'variants' => $variants,
            'transfers' => $transfers,
            'shops' => $shops,
            'shares' => $sharesQuery->take(50)->get(),
            'canManageShares' => $user->hasRole('admin'),
            'filters' => [
                'q' => $q,
                'shop_id' => $shopId > 0 ? $shopId : null,
                'low_stock' => $lowStockOnly,
            ],
        ]);
    }

    public function adjust(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'sales']), 403);

        $validated = $request->validate([
            'variant_id' => 'required|integer|exists:product_variants,id',
            'action' => 'required|in:set,add,remove',
            'quantity' => 'required|integer|min:0',
            'note' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $user): void {
            $variant = ProductVariant::with('product')
                ->whereKey($validated['variant_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $this->authorizeVariantAccess($user, $variant);

            $quantity = (int) $validated['quantity'];
            $currentStock = (int) $variant->stock_level;
            $nextStock = match ($validated['action']) {
                'set' => $quantity,
                'add' => $variant->stock_level + $quantity,
                'remove' => max(0, $variant->stock_level - $quantity),
            };

            $variant->update(['stock_level' => $nextStock]);
            $this->refreshProductStock($variant->product);

            $delta = $nextStock - $currentStock;
            $this->stockMovementLogger->log(
                eventType: 'adjust',
                productId: (int) $variant->product_id,
                variantId: (int) $variant->id,
                shopId: (int) $variant->product->shop_id,
                quantity: $delta,
                unitPrice: (float) $variant->price,
                reference: $variant->product,
                actorId: (int) $user->id,
                note: $validated['note'] ?? 'Manual stock adjustment',
            );
            $this->auditLogger->log(
                event: 'stock.adjusted',
                auditable: $variant,
                old: ['stock_level' => $currentStock],
                new: ['stock_level' => $nextStock],
                meta: ['action' => $validated['action'], 'note' => $validated['note'] ?? null],
                actor: $user,
            );
        });

        return back()->with('success', 'Stock updated successfully.');
    }

    public function transfer(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'sales']), 403);

        $validated = $request->validate([
            'variant_id' => 'required|integer|exists:product_variants,id',
            'to_shop_id' => 'required|integer|exists:shops,id',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string|max:255',
        ]);

        $sourceVariant = ProductVariant::with('product')->findOrFail($validated['variant_id']);
        $fromShopId = (int) $sourceVariant->product->shop_id;
        $toShopId = (int) $validated['to_shop_id'];
        $qty = (int) $validated['quantity'];

        $this->authorizeVariantAccess($user, $sourceVariant);

        if ($toShopId === $fromShopId) {
            throw ValidationException::withMessages([
                'to_shop_id' => 'Destination shop must be different.',
            ]);
        }

        if (!$user->hasRole('admin') && !$this->shareEnabled($fromShopId, $toShopId)) {
            throw ValidationException::withMessages([
                'to_shop_id' => 'Stock sharing is not enabled for selected shops.',
            ]);
        }

        DB::transaction(function () use ($sourceVariant, $fromShopId, $toShopId, $qty, $user, $validated): void {
            $lockedSource = ProductVariant::with('product')
                ->whereKey($sourceVariant->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedSource->stock_level < $qty) {
                throw ValidationException::withMessages([
                    'quantity' => 'Not enough stock to transfer.',
                ]);
            }

            $destinationProduct = Product::where('shop_id', $toShopId)
                ->where('name', $lockedSource->product->name)
                ->where('brand_id', $lockedSource->product->brand_id)
                ->where('category_id', $lockedSource->product->category_id)
                ->first();

            if (!$destinationProduct) {
                $destinationSku = Product::where('sku', $lockedSource->product->sku . '-S' . $toShopId)->exists()
                    ? $lockedSource->product->sku . '-S' . $toShopId . '-' . now()->timestamp
                    : $lockedSource->product->sku . '-S' . $toShopId;

                $destinationProduct = Product::create([
                    'shop_id' => $toShopId,
                    'brand_id' => $lockedSource->product->brand_id,
                    'category_id' => $lockedSource->product->category_id,
                    'name' => $lockedSource->product->name,
                    'slug' => $lockedSource->product->slug . '-s' . $toShopId . '-' . now()->timestamp,
                    'sku' => $destinationSku,
                    'price' => $lockedSource->product->price,
                    'stock_level' => 0,
                    'description' => $lockedSource->product->description,
                    'image_path' => $lockedSource->product->image_path,
                ]);
            }

            $destinationSkuPrefix = $lockedSource->sku . '-S' . $toShopId;
            $destinationVariant = ProductVariant::where('product_id', $destinationProduct->id)
                ->where(function ($query) use ($lockedSource, $destinationSkuPrefix): void {
                    $query->where('sku', $lockedSource->sku)
                        ->orWhere('sku', 'like', $destinationSkuPrefix . '%');
                })
                ->orderBy('id')
                ->first();

            if (!$destinationVariant) {
                $destinationVariantSku = $this->nextAvailableVariantSku($lockedSource->sku, $toShopId);
                $destinationVariant = ProductVariant::create([
                    'product_id' => $destinationProduct->id,
                    'sku' => $destinationVariantSku,
                    'price' => $lockedSource->price,
                    'stock_level' => 0,
                    'is_active' => true,
                ]);
            }

            $lockedSource->decrement('stock_level', $qty);
            $destinationVariant->increment('stock_level', $qty);

            $this->refreshProductStock($lockedSource->product);
            $this->refreshProductStock($destinationProduct);

            StockTransfer::create([
                'source_variant_id' => $lockedSource->id,
                'destination_variant_id' => $destinationVariant->id,
                'from_shop_id' => $fromShopId,
                'to_shop_id' => $toShopId,
                'quantity' => $qty,
                'initiated_by' => $user->id,
                'status' => 'completed',
                'note' => $validated['note'] ?? null,
            ]);

            $this->stockMovementLogger->log(
                eventType: 'transfer',
                productId: (int) $lockedSource->product_id,
                variantId: (int) $lockedSource->id,
                shopId: $fromShopId,
                quantity: -1 * $qty,
                unitPrice: (float) $lockedSource->price,
                reference: $lockedSource->product,
                actorId: (int) $user->id,
                note: $validated['note'] ?? 'Stock transfer out',
                meta: ['to_shop_id' => $toShopId],
            );
            $this->stockMovementLogger->log(
                eventType: 'transfer',
                productId: (int) $destinationVariant->product_id,
                variantId: (int) $destinationVariant->id,
                shopId: $toShopId,
                quantity: $qty,
                unitPrice: (float) $destinationVariant->price,
                reference: $destinationProduct,
                actorId: (int) $user->id,
                note: $validated['note'] ?? 'Stock transfer in',
                meta: ['from_shop_id' => $fromShopId],
            );
            $this->auditLogger->log(
                event: 'stock.transferred',
                auditable: $destinationVariant,
                old: [],
                new: [
                    'from_shop_id' => $fromShopId,
                    'to_shop_id' => $toShopId,
                    'quantity' => $qty,
                ],
                meta: ['source_variant_id' => $lockedSource->id, 'destination_variant_id' => $destinationVariant->id],
                actor: $user,
            );
        });

        return back()->with('success', 'Stock transferred successfully.');
    }

    public function toggleShare(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->hasRole('admin'), 403);

        $validated = $request->validate([
            'from_shop_id' => 'required|integer|exists:shops,id',
            'to_shop_id' => 'required|integer|exists:shops,id|different:from_shop_id',
            'is_enabled' => 'required|boolean',
        ]);

        ShopStockShare::updateOrCreate(
            [
                'from_shop_id' => $validated['from_shop_id'],
                'to_shop_id' => $validated['to_shop_id'],
            ],
            [
                'is_enabled' => (bool) $validated['is_enabled'],
                'updated_by' => $user->id,
            ]
        );

        return back()->with('success', 'Share permission updated.');
    }

    private function authorizeVariantAccess($user, ProductVariant $variant): void
    {
        if ($user->hasRole('admin')) {
            return;
        }

        abort_if((int) $variant->product->shop_id !== (int) $user->shop_id, 403);
    }

    private function shareEnabled(int $fromShopId, int $toShopId): bool
    {
        return ShopStockShare::where('from_shop_id', $fromShopId)
            ->where('to_shop_id', $toShopId)
            ->where('is_enabled', true)
            ->exists();
    }

    private function refreshProductStock(Product $product): void
    {
        $activeVariants = ProductVariant::where('product_id', $product->id)
            ->where('is_active', true)
            ->get(['price', 'stock_level']);

        $product->update([
            'price' => (float) ($activeVariants->min('price') ?? 0),
            'stock_level' => (int) $activeVariants->sum('stock_level'),
        ]);
    }

    private function nextAvailableVariantSku(string $sourceSku, int $toShopId): string
    {
        $base = $sourceSku . '-S' . $toShopId;
        $candidate = $base;
        $counter = 1;

        while (ProductVariant::query()->where('sku', $candidate)->exists()) {
            $counter++;
            $candidate = $base . '-' . $counter;
        }

        return $candidate;
    }
}
