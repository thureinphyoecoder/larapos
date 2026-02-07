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
            $keyword = trim((string) $request->input('search'));
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', '%' . $keyword . '%')
                    ->orWhereHas('brand', fn ($b) => $b->where('name', 'like', '%' . $keyword . '%'))
                    ->orWhereHas('shop', fn ($s) => $s->where('name', 'like', '%' . $keyword . '%'));
            });
        }

        if ($request->filled('category')) {
            $query->where('category_id', (int) $request->input('category'));
        }

        return Inertia::render('Welcome', [
            'products' => $query->latest()->get(),
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
