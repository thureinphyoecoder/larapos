<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopStockShare extends Model
{
    protected $fillable = [
        'from_shop_id',
        'to_shop_id',
        'is_enabled',
        'updated_by',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public function fromShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'from_shop_id');
    }

    public function toShop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'to_shop_id');
    }
}
