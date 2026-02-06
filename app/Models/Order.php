<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
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
}
