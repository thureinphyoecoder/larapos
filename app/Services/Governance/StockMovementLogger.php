<?php

namespace App\Services\Governance;

use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Model;

class StockMovementLogger
{
    public function log(
        string $eventType,
        int $productId,
        int $variantId,
        int $shopId,
        int $quantity,
        ?float $unitPrice = null,
        ?Model $reference = null,
        ?int $actorId = null,
        ?string $note = null,
        array $meta = []
    ): void {
        StockMovement::query()->create([
            'event_type' => $eventType,
            'product_id' => $productId,
            'product_variant_id' => $variantId,
            'shop_id' => $shopId,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'reference_type' => $reference?->getMorphClass(),
            'reference_id' => $reference?->getKey(),
            'actor_id' => $actorId,
            'note' => $note,
            'meta' => $meta !== [] ? $meta : null,
        ]);
    }
}
