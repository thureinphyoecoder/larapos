<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminProductController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Products/Index', [
            'products' => Product::with(['category', 'shop', 'variants' => fn ($query) => $query->orderBy('id')])
                ->latest()
                ->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Products/Create', [
            'categories' => Category::all(),
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:64|unique:products,sku',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'variants' => 'required|array|min:1|max:20',
            'variants.*.id' => 'nullable|integer',
            'variants.*.label' => 'required|string|max:50',
            'variants.*.sku' => 'nullable|string|max:64',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.stock_level' => 'required|integer|min:0',
            'variants.*.is_active' => 'nullable|boolean',
        ]);

        $variants = $this->normalizeVariants($validated['variants']);

        if (empty($variants)) {
            throw ValidationException::withMessages([
                'variants' => 'At least one valid variant is required.',
            ]);
        }

        $productSku = $validated['sku'] ?: $this->generateProductSku($validated['name']);

        DB::transaction(function () use ($request, $user, $validated, $variants, $productSku): void {
            $productData = [
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']) . '-' . Str::lower(Str::random(6)),
                'shop_id' => $user->shop_id ?: 1,
                'category_id' => $validated['category_id'],
                'description' => $validated['description'] ?? null,
                'sku' => $productSku,
                'price' => min(array_column($variants, 'price')),
                'stock_level' => array_sum(array_column($variants, 'stock_level')),
            ];

            if ($request->hasFile('image')) {
                $productData['image_path'] = $request->file('image')->store('products', 'public');
            }

            $product = Product::create($productData);

            foreach ($variants as $index => $variant) {
                $requestedSku = trim((string) ($variant['sku'] ?? ''));
                $fallbackSku = $product->sku . '-' . Str::upper(Str::slug($variant['label'] ?: 'V' . ($index + 1)));
                $variantSku = $this->ensureUniqueVariantSku($requestedSku !== '' ? $requestedSku : $fallbackSku);

                $product->variants()->create([
                    'sku' => $variantSku,
                    'price' => $variant['price'],
                    'stock_level' => $variant['stock_level'],
                    'is_active' => (bool) $variant['is_active'],
                ]);
            }
        });

        return redirect()->route('admin.products.index')->with('success', 'Product and variants created.');
    }

    public function edit(Product $product)
    {
        return Inertia::render('Admin/Products/Edit', [
            'product' => $product->load(['variants' => fn ($query) => $query->orderBy('id')]),
            'categories' => Category::all(),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:64|unique:products,sku,' . $product->id,
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'variants' => 'required|array|min:1|max:20',
            'variants.*.id' => 'nullable|integer|exists:product_variants,id',
            'variants.*.label' => 'required|string|max:50',
            'variants.*.sku' => 'nullable|string|max:64',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.stock_level' => 'required|integer|min:0',
            'variants.*.is_active' => 'nullable|boolean',
        ]);

        $variants = $this->normalizeVariants($validated['variants']);

        if (empty($variants)) {
            throw ValidationException::withMessages([
                'variants' => 'At least one valid variant is required.',
            ]);
        }

        DB::transaction(function () use ($request, $product, $validated, $variants): void {
            $baseSku = $validated['sku'] ?: $product->sku ?: $this->generateProductSku($validated['name']);

            $updateData = [
                'name' => $validated['name'],
                'category_id' => $validated['category_id'],
                'description' => $validated['description'] ?? null,
                'sku' => $baseSku,
            ];

            if ($request->hasFile('image')) {
                if ($product->image_path) {
                    Storage::disk('public')->delete($product->image_path);
                }
                $updateData['image_path'] = $request->file('image')->store('products', 'public');
            }

            $product->update($updateData);

            $this->syncVariants($product, $variants);

            $activeVariants = $product->variants()->where('is_active', true)->get(['price', 'stock_level']);
            $product->update([
                'price' => (float) ($activeVariants->min('price') ?? 0),
                'stock_level' => (int) $activeVariants->sum('stock_level'),
            ]);
        });

        return redirect()->route('admin.products.index')->with('success', 'Product updated with variants.');
    }

    public function destroy(Product $product)
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->delete();

        return back()->with('success', 'Product deleted.');
    }

    private function normalizeVariants(array $variants): array
    {
        $normalized = [];

        foreach ($variants as $variant) {
            if (!is_array($variant)) {
                continue;
            }

            $normalized[] = [
                'id' => isset($variant['id']) ? (int) $variant['id'] : null,
                'label' => trim((string) ($variant['label'] ?? '')),
                'sku' => trim((string) ($variant['sku'] ?? '')),
                'price' => (float) ($variant['price'] ?? 0),
                'stock_level' => max(0, (int) ($variant['stock_level'] ?? 0)),
                'is_active' => array_key_exists('is_active', $variant)
                    ? filter_var($variant['is_active'], FILTER_VALIDATE_BOOLEAN)
                    : true,
            ];
        }

        $this->ensureNoDuplicateSkuInPayload($normalized);

        return $normalized;
    }

    private function ensureNoDuplicateSkuInPayload(array $variants): void
    {
        $seen = [];

        foreach ($variants as $variant) {
            $sku = Str::upper(trim((string) ($variant['sku'] ?? '')));
            if ($sku === '') {
                continue;
            }

            if (isset($seen[$sku])) {
                throw ValidationException::withMessages([
                    'variants' => 'Variant SKUs must be unique in the form.',
                ]);
            }

            $seen[$sku] = true;
        }
    }

    private function syncVariants(Product $product, array $variants): void
    {
        $existing = $product->variants()->get()->keyBy('id');
        $submittedIds = collect($variants)->pluck('id')->filter()->map(fn ($id) => (int) $id)->values();

        foreach ($variants as $index => $variant) {
            $variantId = $variant['id'];
            $requestedSku = $variant['sku'];
            $fallbackSku = $product->sku . '-' . Str::upper(Str::slug($variant['label'] ?: 'V' . ($index + 1)));
            $sku = $this->ensureUniqueVariantSku($requestedSku !== '' ? $requestedSku : $fallbackSku, $variantId ?: null);

            if ($variantId && $existing->has($variantId)) {
                $existing[$variantId]->update([
                    'sku' => $sku,
                    'price' => $variant['price'],
                    'stock_level' => $variant['stock_level'],
                    'is_active' => (bool) $variant['is_active'],
                ]);
                continue;
            }

            $product->variants()->create([
                'sku' => $sku,
                'price' => $variant['price'],
                'stock_level' => $variant['stock_level'],
                'is_active' => (bool) $variant['is_active'],
            ]);
        }

        $toRemove = $existing->filter(fn ($row) => !$submittedIds->contains((int) $row->id));

        foreach ($toRemove as $variant) {
            $inUse = DB::table('order_items')->where('product_variant_id', $variant->id)->exists()
                || DB::table('cart_items')->where('variant_id', $variant->id)->exists();

            if ($inUse) {
                $variant->update([
                    'is_active' => false,
                    'stock_level' => 0,
                ]);
                continue;
            }

            $variant->delete();
        }
    }

    private function generateProductSku(string $name): string
    {
        $base = Str::upper(Str::slug($name));

        do {
            $sku = $base . '-' . random_int(100, 999);
        } while (Product::where('sku', $sku)->exists());

        return $sku;
    }

    private function ensureUniqueVariantSku(string $candidate, ?int $ignoreVariantId = null): string
    {
        $candidate = trim($candidate);
        $candidate = $candidate !== '' ? Str::upper($candidate) : 'VAR-' . Str::upper(Str::random(6));

        $sku = $candidate;
        $counter = 1;

        while (
            ProductVariant::where('sku', $sku)
                ->when($ignoreVariantId, fn ($query) => $query->where('id', '!=', $ignoreVariantId))
                ->exists()
        ) {
            $sku = $candidate . '-' . $counter;
            $counter++;
        }

        return $sku;
    }
}
