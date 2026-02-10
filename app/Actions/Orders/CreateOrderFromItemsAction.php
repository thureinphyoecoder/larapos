<?php

namespace App\Actions\Orders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Governance\AuditLogger;
use App\Services\Governance\DocumentNumberService;
use App\Services\Governance\StockMovementLogger;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrderFromItemsAction
{
    public function __construct(
        private readonly RefreshProductStockAction $refreshProductStockAction,
        private readonly DocumentNumberService $documentNumberService,
        private readonly StockMovementLogger $stockMovementLogger,
        private readonly AuditLogger $auditLogger,
    ) {
    }

    /**
     * @param array<int, array{variant_id:int, quantity:int}> $items
     */
    public function execute(
        User $user,
        array $items,
        ?string $phone = null,
        ?string $address = null,
        ?string $customerName = null,
        ?int $customerId = null,
        ?int $forcedShopId = null,
        ?UploadedFile $paymentSlip = null,
        ?string $idempotencyKey = null,
    ): Order {
        if ($items === []) {
            throw ValidationException::withMessages([
                'items' => 'Order items are required.',
            ]);
        }

        $normalized = collect($items)
            ->map(fn (array $item) => [
                'variant_id' => (int) ($item['variant_id'] ?? 0),
                'quantity' => (int) ($item['quantity'] ?? 0),
            ])
            ->filter(fn (array $item) => $item['variant_id'] > 0 && $item['quantity'] > 0)
            ->groupBy('variant_id')
            ->map(fn (Collection $group, int|string $variantId) => [
                'variant_id' => (int) $variantId,
                'quantity' => (int) $group->sum('quantity'),
            ])
            ->sortBy('variant_id')
            ->values();

        if ($normalized->isEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Order items are invalid.',
            ]);
        }

        return DB::transaction(function () use ($user, $normalized, $phone, $address, $customerName, $customerId, $forcedShopId, $paymentSlip, $idempotencyKey): Order {
            if ($idempotencyKey) {
                $existing = Order::query()
                    ->where('user_id', $user->id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existing) {
                    return $existing->load(['user.roles', 'shop', 'items.product.shop', 'items.variant']);
                }
            }

            $variantIds = $normalized->pluck('variant_id')->all();
            $normalizedPhone = trim((string) $phone);
            $normalizedAddress = trim((string) $address);
            $normalizedCustomerName = trim((string) $customerName);

            $variants = ProductVariant::query()
                ->with('product:id,shop_id')
                ->whereIn('id', $variantIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($variants->count() !== count($variantIds)) {
                throw ValidationException::withMessages([
                    'items' => 'Some variants are missing.',
                ]);
            }

            $shopIds = collect($variantIds)
                ->map(fn (int $id) => $variants[$id]?->product?->shop_id)
                ->filter()
                ->unique()
                ->values();

            if ($forcedShopId) {
                $shopIds->push($forcedShopId);
                $shopIds = $shopIds->unique()->values();
            }

            if ($shopIds->isEmpty() && $user->shop_id) {
                $shopIds->push((int) $user->shop_id);
            }

            if ($shopIds->count() !== 1) {
                throw ValidationException::withMessages([
                    'items' => 'Unable to resolve shop for this order. Please assign shop to product or user.',
                ]);
            }

            $itemRows = [];
            $affectedProductIds = [];
            $total = 0.0;

            foreach ($normalized as $item) {
                $variant = $variants[$item['variant_id']];
                $qty = (int) $item['quantity'];

                if (! $variant->is_active) {
                    throw ValidationException::withMessages([
                        'items' => "Variant {$variant->sku} is inactive.",
                    ]);
                }

                if ((int) $variant->stock_level < $qty) {
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for {$variant->sku}.",
                    ]);
                }

                $price = (float) $variant->price;
                $total += $price * $qty;
                $affectedProductIds[] = (int) $variant->product_id;

                $itemRows[] = [
                    'product_id' => (int) $variant->product_id,
                    'product_variant_id' => (int) $variant->id,
                    'quantity' => $qty,
                    'price' => $price,
                ];
            }

            $paymentSlipPath = $paymentSlip
                ? $paymentSlip->storePublicly('slips', 'public')
                : null;

            $resolvedCustomer = null;
            if ($customerId) {
                $resolvedCustomer = Customer::query()->find($customerId);
                if (! $resolvedCustomer) {
                    throw ValidationException::withMessages([
                        'customer_id' => 'Customer not found.',
                    ]);
                }
            } elseif ($normalizedPhone !== '') {
                $resolvedCustomer = Customer::query()->firstOrCreate(
                    [
                        'phone' => $normalizedPhone,
                        'name' => $normalizedCustomerName !== '' ? $normalizedCustomerName : 'POS Customer',
                    ],
                    [
                        'address' => $normalizedAddress !== '' ? $normalizedAddress : null,
                        'created_by' => $user->id,
                    ],
                );
            }

            $shopId = (int) $shopIds->first();
            $order = Order::query()->create([
                'invoice_no' => $this->documentNumberService->next('invoice', $shopId),
                'receipt_no' => $this->documentNumberService->next('receipt', $shopId),
                'job_no' => $this->documentNumberService->next('job', $shopId),
                'idempotency_key' => $idempotencyKey,
                'user_id' => $user->id,
                'customer_id' => $resolvedCustomer?->id,
                'shop_id' => $shopId,
                'total_amount' => $total,
                'payment_slip' => $paymentSlipPath,
                'status' => 'pending',
                'phone' => $normalizedPhone !== '' ? $normalizedPhone : null,
                'address' => $normalizedAddress !== '' ? $normalizedAddress : null,
            ]);

            $now = now();
            $payload = array_map(function (array $row) use ($order, $now): array {
                return [
                    'order_id' => $order->id,
                    'product_id' => $row['product_id'],
                    'product_variant_id' => $row['product_variant_id'],
                    'qty' => $row['quantity'],
                    'unit_price' => $row['price'],
                    'quantity' => $row['quantity'],
                    'price' => $row['price'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }, $itemRows);

            OrderItem::query()->insert($payload);

            foreach ($itemRows as $row) {
                $affected = ProductVariant::query()
                    ->whereKey((int) $row['product_variant_id'])
                    ->where('stock_level', '>=', (int) $row['quantity'])
                    ->decrement('stock_level', (int) $row['quantity']);

                if ($affected !== 1) {
                    $variant = $variants[(int) $row['product_variant_id']];
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for {$variant->sku}.",
                    ]);
                }
            }

            if ($paymentSlipPath) {
                Payment::query()->create([
                    'order_id' => $order->id,
                    'event_type' => 'deposit',
                    'amount' => $total,
                    'status' => 'pending_verification',
                    'note' => 'Deposit created from uploaded payment slip',
                    'actor_id' => $user->id,
                    'meta' => ['payment_slip' => $paymentSlipPath],
                ]);
            }

            foreach ($itemRows as $row) {
                $this->stockMovementLogger->log(
                    eventType: 'sale',
                    productId: (int) $row['product_id'],
                    variantId: (int) $row['product_variant_id'],
                    shopId: $shopId,
                    quantity: -1 * (int) $row['quantity'],
                    unitPrice: (float) $row['price'],
                    reference: $order,
                    actorId: (int) $user->id,
                );
            }

            $this->auditLogger->log(
                event: 'order.created',
                auditable: $order,
                old: [],
                new: [
                    'invoice_no' => $order->invoice_no,
                    'receipt_no' => $order->receipt_no,
                    'job_no' => $order->job_no,
                    'shop_id' => $order->shop_id,
                    'total_amount' => (float) $order->total_amount,
                    'status' => $order->status,
                ],
                actor: $user,
            );

            $this->refreshProductStockAction->execute($affectedProductIds);

            return $order->load(['user.roles', 'shop', 'items.product.shop', 'items.variant']);
        });
    }
}
