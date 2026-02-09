<?php

namespace App\Models;

use App\Services\Governance\DocumentNumberService;
use LogicException;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'invoice_no',
        'receipt_no',
        'job_no',
        'user_id',
        'shop_id',
        'total_amount',
        'payment_slip',
        'status',
        'phone',
        'address',
        'delivery_lat',
        'delivery_lng',
        'delivery_updated_at',
        'delivery_proof_path',
        'shipped_at',
        'slip_verdict',
        'slip_score',
        'slip_checked_at',
        'slip_hash',
        'slip_notes',
        'slip_meta',
        'refund_requested_at',
        'refunded_at',
        'return_requested_at',
        'returned_at',
        'return_reason',
        'delivered_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $order): void {
            if (! $order->shop_id) {
                return;
            }

            /** @var DocumentNumberService $numbering */
            $numbering = app(DocumentNumberService::class);
            $order->invoice_no ??= $numbering->next('invoice', (int) $order->shop_id);
            $order->receipt_no ??= $numbering->next('receipt', (int) $order->shop_id);
            $order->job_no ??= $numbering->next('job', (int) $order->shop_id);
        });

        static::updating(function (self $order): void {
            $immutableFinancialFields = [
                'invoice_no',
                'receipt_no',
                'job_no',
                'total_amount',
                'payment_slip',
            ];

            foreach ($immutableFinancialFields as $field) {
                if ($order->isDirty($field)) {
                    throw new LogicException("{$field} is immutable. Use reversal/adjustment flow.");
                }
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function approvalRequests()
    {
        return $this->hasMany(ApprovalRequest::class);
    }

    public function financialAdjustments()
    {
        return $this->hasMany(FinancialAdjustment::class);
    }
}
