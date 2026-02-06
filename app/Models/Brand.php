<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    protected $fillable = ['name'];

    // Relationship: Brand တစ်ခုမှာ Product တွေ အများကြီးရှိနိုင်တယ်
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
