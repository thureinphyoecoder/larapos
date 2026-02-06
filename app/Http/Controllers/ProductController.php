<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['variants', 'shop', 'brand']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        return Inertia::render('Welcome', [
            'products' => Product::with(['variants', 'brand', 'shop'])->get(),
            'categories' => Category::all(),
            'filters' => $request->only(['search', 'category'])
        ]);
    }

    public function show($slug) // ID အစား Slug နဲ့ ရှာမယ်
    {
        $product = Product::with(['variants', 'shop', 'brand', 'category'])
            ->where('slug', $slug)
            ->firstOrFail();

        return Inertia::render('ProductDetail', [
            'product' => $product
        ]);
    }
}
