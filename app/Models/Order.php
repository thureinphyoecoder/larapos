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
        'idempotency_key',
        'user_id',
        'customer_id',
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

    protected $casts = [
        'total_amount' => 'decimal:2',
        'delivery_lat' => 'float',
        'delivery_lng' => 'float',
        'delivery_updated_at' => 'datetime',
        'shipped_at' => 'datetime',
        'slip_checked_at' => 'datetime',
        'refund_requested_at' => 'datetime',
        'refunded_at' => 'datetime',
        'return_requested_at' => 'datetime',
        'returned_at' => 'datetime',
        'delivered_at' => 'datetime',
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

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function discounts()
    {
        return $this->hasMany(OrderDiscount::class);
    }

    public function taxes()
    {
        return $this->hasMany(OrderTax::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function approvalRequests()
    {
        return $this->hasMany(ApprovalRequest::class);
    }

    public function financialAdjustments()
    {
        return $this->hasMany(FinancialAdjustment::class);
    }

    public function derivedSubtotal(): float
    {
        return (float) $this->items->sum(fn (OrderItem $item) => ((float) ($item->unit_price ?? $item->price)) * ((int) ($item->qty ?? $item->quantity)));
    }

    public function derivedDiscount(): float
    {
        return (float) $this->discounts->sum('amount');
    }

    public function derivedTax(): float
    {
        return (float) $this->taxes->sum('amount');
    }

    public function derivedTotal(): float
    {
        return max(0, $this->derivedSubtotal() - $this->derivedDiscount() + $this->derivedTax());
    }

    public function paidTotal(): float
    {
        return (float) $this->payments->sum('amount');
    }
}
