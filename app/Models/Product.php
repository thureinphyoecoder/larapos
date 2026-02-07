<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'shop_id',
        'brand_id',
        'category_id',
        'name',
        'slug',
        'sku',
        'price',
        'stock_level',
        'description',
        'image_path',
    ];

    // ၁။ ဆိုင်နဲ့ချိတ်မယ် (ပစ္စည်းတစ်ခုက ဆိုင်တစ်ဆိုင်မှာပဲ ရှိမယ်)
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    // ၂။ Brand နဲ့ချိတ်မယ်
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    // ၃။ Category နဲ့ချိတ်မယ်
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // ၄။ Variants (အရင်က ထည့်ပြီးသားဆိုရင် ဒီအတိုင်းထားပါ)
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            // အကယ်၍ slug မပါလာရင် နာမည်ကို slug ပြောင်းပြီး ထည့်ပေးမယ်
            if (! $product->slug) {
                $product->slug = \Illuminate\Support\Str::slug($product->name) . '-' . \Illuminate\Support\Str::random(5);
            }
        });
    }
}
