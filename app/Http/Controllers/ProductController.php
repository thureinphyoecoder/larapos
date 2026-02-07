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
        return Inertia::render('Welcome', [
            'products' => Product::with(['variants', 'brand', 'shop'])->latest()->get(),
            'categories' => Category::all(),
            'filters' => $request->only(['search', 'category'])
        ]);
    }

    public function show($slug) // ID အစား Slug နဲ့ ရှာမယ်
    {
        $product = Product::with(['variants', 'shop', 'brand', 'category'])
            ->where('slug', $slug)
            ->firstOrFail();

        $reviews = $product->reviews()
            ->with('user')
            ->latest()
            ->get()
            ->map(fn ($review) => [
                'id' => $review->id,
                'reviewer_name' => $review->reviewer_name ?: ($review->user?->name ?? 'Customer'),
                'rating' => $review->rating,
                'comment' => $review->comment,
                'created_at_human' => $review->created_at?->diffForHumans(),
                'created_at' => $review->created_at,
            ])
            ->values();

        $ratingQuery = $product->reviews()->whereNotNull('rating');
        $ratingCount = (clone $ratingQuery)->count();
        $ratingAverage = $ratingCount > 0
            ? round((float) (clone $ratingQuery)->avg('rating'), 1)
            : 0.0;

        return Inertia::render('ProductDetail', [
            'product' => $product,
            'reviews' => $reviews,
            'ratingSummary' => [
                'average' => $ratingAverage,
                'count' => $ratingCount,
            ],
        ]);
    }
}
