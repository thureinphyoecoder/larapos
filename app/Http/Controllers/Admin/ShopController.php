<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShopController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Shops/Index', [
            'shops' => Shop::withCount(['products', 'users', 'orders'])->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:shops,name'],
        ]);

        Shop::create($validated);

        return back()->with('success', 'Shop created successfully.');
    }

    public function update(Request $request, Shop $shop): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:shops,name,' . $shop->id],
        ]);

        $shop->update($validated);

        return back()->with('success', 'Shop updated successfully.');
    }

    public function destroy(Shop $shop): RedirectResponse
    {
        $shop->loadCount(['products', 'users', 'orders']);

        if ($shop->products_count > 0 || $shop->users_count > 0 || $shop->orders_count > 0) {
            return back()->with('error', 'Cannot delete this shop while products/users/orders are linked.');
        }

        $shop->delete();

        return back()->with('success', 'Shop deleted successfully.');
    }
}
