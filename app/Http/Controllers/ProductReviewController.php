<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ProductReviewController extends Controller
{
    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'rating' => 'nullable|integer|min:1|max:5',
            'comment' => 'nullable|string|min:2|max:1200',
        ]);

        if (empty($validated['rating']) && empty($validated['comment'])) {
            throw ValidationException::withMessages([
                'review' => 'Please submit a rating or a comment.',
            ]);
        }

        $user = $request->user();

        ProductReview::create([
            'product_id' => $product->id,
            'user_id' => $user?->id,
            'reviewer_name' => $user?->name,
            'rating' => $validated['rating'] ?? null,
            'comment' => $validated['comment'] ?? null,
        ]);

        return back()->with('success', 'Thanks for your review.');
    }
}
