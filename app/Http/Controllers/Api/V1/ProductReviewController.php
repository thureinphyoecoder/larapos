<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ProductReviewController extends Controller
{
    public function store(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1200'],
        ]);

        $cleanComment = isset($validated['comment'])
            ? trim((string) preg_replace('/\s+/u', ' ', strip_tags((string) $validated['comment'])))
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

        $review = ProductReview::query()->create([
            'product_id' => $product->id,
            'user_id' => $user?->id,
            'reviewer_name' => $user?->name,
            'rating' => $validated['rating'] ?? null,
            'comment' => $cleanComment,
        ]);

        return response()->json([
            'message' => 'Thanks for your review.',
            'data' => [
                'id' => $review->id,
            ],
        ], 201);
    }
}
