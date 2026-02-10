<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalRequest extends Model
{
    protected $fillable = [
        'request_type',
        'status',
        'order_id',
        'requested_by',
        'approved_by',
        'amount',
        'reason',
        'payload',
        'approved_at',
        'rejected_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
