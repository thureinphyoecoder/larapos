<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyBranchClosing extends Model
{
    protected $fillable = [
        'shop_id',
        'business_date',
        'closed_by',
        'orders_count',
        'gross_amount',
        'refund_amount',
        'net_amount',
        'summary',
    ];

    protected function casts(): array
    {
        return [
            'business_date' => 'date',
            'gross_amount' => 'decimal:2',
            'refund_amount' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'summary' => 'array',
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }
}
