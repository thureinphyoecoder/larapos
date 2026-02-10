<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftClosing extends Model
{
    protected $fillable = [
        'shop_id',
        'cashier_id',
        'closed_by',
        'shift_started_at',
        'shift_ended_at',
        'orders_count',
        'gross_amount',
        'refund_amount',
        'net_amount',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'shift_started_at' => 'datetime',
            'shift_ended_at' => 'datetime',
            'gross_amount' => 'decimal:2',
            'refund_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'meta' => 'array',
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }
}
