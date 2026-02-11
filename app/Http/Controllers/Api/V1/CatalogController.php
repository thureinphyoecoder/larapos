<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\ProductIndexRequest;
use App\Http\Resources\Api\V1\BrandResource;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Http\Resources\Api\V1\ProductResource;
use App\Http\Resources\Api\V1\ShopResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    public function products(ProductIndexRequest $request): JsonResponse
    {
        $query = Product::query()
            ->with([
                'shop:id,name',
                'brand:id,name',
                'category:id,name,slug',
                'activeVariants' => fn ($q) => $q->orderBy('id'),
            ])
            ->latest('id');

        $query->when($request->filled('q'), function ($q) use ($request) {
            $keyword = trim($request->string('q')->toString());
            $q->where(function ($qq) use ($keyword) {
                $qq->where('name', 'like', "%{$keyword}%")
                    ->orWhere('sku', 'like', "%{$keyword}%");
            });
        });

        $query->when($request->filled('shop_id'), fn ($q) => $q->where('shop_id', $request->integer('shop_id')));
        $query->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')));
        $query->when($request->filled('brand_id'), fn ($q) => $q->where('brand_id', $request->integer('brand_id')));
        $query->when($request->boolean('active_only'), fn ($q) => $q->whereHas('activeVariants'));

        $products = $query->paginate($request->integer('per_page', 20))->withQueryString();

        return response()->json([
            'data' => ProductResource::collection($products->getCollection()),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function product(Product $product): JsonResponse
    {
        $product->load([
            'shop:id,name',
            'brand:id,name',
            'category:id,name,slug',
            'variants' => fn ($q) => $q->orderBy('id'),
            'activeVariants' => fn ($q) => $q->orderBy('id'),
            'reviews' => fn ($q) => $q->with('user:id,name')->latest('id')->limit(20),
        ]);

        return response()->json([
            'data' => new ProductResource($product),
        ]);
    }

    public function meta(): JsonResponse
    {
        return response()->json([
            'shops' => ShopResource::collection(Shop::query()->orderBy('name')->get()),
            'categories' => CategoryResource::collection(Category::query()->orderBy('name')->get()),
            'brands' => BrandResource::collection(Brand::query()->orderBy('name')->get()),
        ]);
    }
}
