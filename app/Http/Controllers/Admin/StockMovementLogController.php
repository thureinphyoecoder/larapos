<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementLogController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'accountant']), 403);

        $query = StockMovement::query()
            ->with(['product:id,name,sku', 'variant:id,sku', 'shop:id,name', 'actor:id,name'])
            ->latest('id');

        if ($request->filled('event_type')) {
            $query->where('event_type', (string) $request->string('event_type'));
        }

        if ($request->filled('shop_id')) {
            $query->where('shop_id', (int) $request->integer('shop_id'));
        }

        if ($request->filled('q')) {
            $q = trim((string) $request->string('q'));
            $query->where(function ($builder) use ($q): void {
                $builder
                    ->where('note', 'like', "%{$q}%")
                    ->orWhereHas('product', fn ($sub) => $sub->where('name', 'like', "%{$q}%")->orWhere('sku', 'like', "%{$q}%"))
                    ->orWhereHas('variant', fn ($sub) => $sub->where('sku', 'like', "%{$q}%"));
            });
        }

        return Inertia::render('Admin/StockMovements/Index', [
            'movements' => $query->paginate(30)->withQueryString(),
            'shops' => Shop::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'q' => $request->string('q')->toString(),
                'event_type' => $request->string('event_type')->toString(),
                'shop_id' => $request->integer('shop_id') ?: null,
            ],
        ]);
    }
}
