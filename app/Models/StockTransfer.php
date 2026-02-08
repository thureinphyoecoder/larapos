<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransfer extends Model
{
    protected $fillable = [
        'source_variant_id',
        'destination_variant_id',
        'from_shop_id',
        'to_shop_id',
        'quantity',
        'initiated_by',
        'status',
        'note',
    ];

    public function sourceVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'source_variant_id');
    }

    public function destinationVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'destination_variant_id');
    }

    public function fromShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'from_shop_id');
    }

    public function toShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'to_shop_id');
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }
}
