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
            'comment' => 'nullable|string|max:1200',
        ]);

        $cleanComment = isset($validated['comment'])
            ? trim(preg_replace('/\s+/u', ' ', strip_tags($validated['comment'])))
            : null;

        if ($cleanComment !== null && mb_strlen($cleanComment) < 2) {
            throw ValidationException::withMessages([
                'comment' => 'Comment must contain at least 2 readable characters.',
            ]);
        }

        if (empty($validated['rating']) && empty($cleanComment)) {
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
            'comment' => $cleanComment,
        ]);

        return back()->with('success', 'Thanks for your review.');
    }
}
