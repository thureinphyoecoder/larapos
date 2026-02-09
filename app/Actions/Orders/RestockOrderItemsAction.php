<?php

namespace App\Actions\Orders;

use App\Models\Order;
use App\Services\Governance\StockMovementLogger;
use Illuminate\Support\Facades\DB;

class RestockOrderItemsAction
{
    public function __construct(
        private readonly RefreshProductStockAction $refreshProductStockAction,
        private readonly StockMovementLogger $stockMovementLogger,
    ) {
    }

    public function execute(Order $order): void
    {
        DB::transaction(function () use ($order): void {
            $rows = $order->items()
                ->selectRaw('product_variant_id, product_id, SUM(quantity) as qty')
                ->groupBy('product_variant_id', 'product_id')
                ->get();

            if ($rows->isEmpty()) {
                return;
            }

            $case = [];
            $variantIds = [];

            foreach ($rows as $row) {
                $variantId = (int) $row->product_variant_id;
                $qty = (int) $row->qty;
                $case[] = "WHEN {$variantId} THEN {$qty}";
                $variantIds[] = $variantId;
            }

            $variantIdList = implode(',', $variantIds);
            $caseSql = implode(' ', $case);

            // Atomic restock in one query instead of per-row increment loops.
            DB::update(
                "UPDATE product_variants SET stock_level = stock_level + CASE id {$caseSql} ELSE 0 END WHERE id IN ({$variantIdList})"
            );

            foreach ($rows as $row) {
                $this->stockMovementLogger->log(
                    eventType: 'adjust',
                    productId: (int) $row->product_id,
                    variantId: (int) $row->product_variant_id,
                    shopId: (int) $order->shop_id,
                    quantity: (int) $row->qty,
                    reference: $order,
                    actorId: request()->user()?->id,
                    note: 'Order restock adjustment',
                );
            }

            $this->refreshProductStockAction->execute($rows->pluck('product_id'));
        });
    }
}
