<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GlobalSearchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'sales', 'delivery']), 403);

        $q = trim((string) $request->get('q', ''));
        if ($q === '') {
            return Inertia::render('Admin/Search/Index', [
                'q' => '',
                'results' => [
                    'products' => [],
                    'variants' => [],
                    'orders' => [],
                    'users' => [],
                ],
            ]);
        }

        $productsQuery = Product::with(['shop', 'brand', 'category'])
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%");
            })
            ->latest();

        $variantsQuery = ProductVariant::with(['product.shop'])
            ->where('sku', 'like', "%{$q}%")
            ->latest();

        $ordersQuery = Order::with(['user', 'shop'])
            ->where(function ($query) use ($q) {
                $query->where('id', 'like', "%{$q}%")
                    ->orWhere('status', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            })
            ->latest();

        $usersQuery = User::with(['roles', 'shop'])
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            })
            ->latest();

        if (!$user->hasRole('admin')) {
            $productsQuery->where('shop_id', $user->shop_id);
            $variantsQuery->whereHas('product', fn ($query) => $query->where('shop_id', $user->shop_id));
            $ordersQuery->where('shop_id', $user->shop_id);
            $usersQuery->where('shop_id', $user->shop_id);
        }

        if ($user->hasRole('delivery')) {
            $usersQuery->whereRaw('1=0');
        }

        return Inertia::render('Admin/Search/Index', [
            'q' => $q,
            'results' => [
                'products' => $productsQuery->take(12)->get(),
                'variants' => $variantsQuery->take(12)->get(),
                'orders' => $ordersQuery->take(12)->get(),
                'users' => $usersQuery->take(12)->get(),
            ],
        ]);
    }
}
