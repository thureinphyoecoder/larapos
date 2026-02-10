<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'event_type',
        'amount',
        'currency',
        'status',
        'reference_no',
        'note',
        'actor_id',
        'approved_by',
        'approved_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'approved_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (): void {
            throw new LogicException('Payments ledger is append-only. Create a new payment event instead of update.');
        });

        static::deleting(function (): void {
            throw new LogicException('Payments ledger is append-only. Delete is not allowed.');
        });
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
