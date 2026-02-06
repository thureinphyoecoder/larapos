<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\CartItem;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_sales' => Order::where('status', 'completed')->sum('total_price'),
                'order_count' => Order::count(),
                'product_count' => Product::count(),
                'customer_count' => User::where('role', 'user')->count(),
            ]
        ]);
    }
}
