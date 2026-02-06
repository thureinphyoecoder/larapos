<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Inertia\Inertia;

class ShopController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Shops/Index', [
            'shops' => Shop::withCount(['products', 'users', 'orders'])->orderBy('name')->get(),
        ]);
    }
}
