<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'accountant']), 403);

        $query = AuditLog::query()->with('actor:id,name,email')->latest('id');

        if ($user->hasRole('manager')) {
            $shopId = (int) $user->shop_id;
            $query->where(function ($builder) use ($shopId): void {
                $builder->whereHas('actor', fn ($actor) => $actor->where('shop_id', $shopId))
                    ->orWhere(function ($sub) use ($shopId): void {
                        $sub->where('auditable_type', Order::class)
                            ->whereExists(function ($exists) use ($shopId): void {
                                $exists->select(DB::raw(1))
                                    ->from('orders')
                                    ->whereColumn('orders.id', 'audit_logs.auditable_id')
                                    ->where('orders.shop_id', $shopId);
                            });
                    })
                    ->orWhere(function ($sub) use ($shopId): void {
                        $sub->where('auditable_type', Product::class)
                            ->whereExists(function ($exists) use ($shopId): void {
                                $exists->select(DB::raw(1))
                                    ->from('products')
                                    ->whereColumn('products.id', 'audit_logs.auditable_id')
                                    ->where('products.shop_id', $shopId);
                            });
                    })
                    ->orWhere(function ($sub) use ($shopId): void {
                        $sub->where('auditable_type', ProductVariant::class)
                            ->whereExists(function ($exists) use ($shopId): void {
                                $exists->select(DB::raw(1))
                                    ->from('product_variants')
                                    ->join('products', 'products.id', '=', 'product_variants.product_id')
                                    ->whereColumn('product_variants.id', 'audit_logs.auditable_id')
                                    ->where('products.shop_id', $shopId);
                            });
                    })
                    ->orWhere(function ($sub) use ($shopId): void {
                        $sub->where('auditable_type', Shop::class)
                            ->where('auditable_id', $shopId);
                    })
                    ->orWhere('meta->shop_id', $shopId);
            });
        }

        if ($request->filled('event')) {
            $query->where('event', 'like', '%' . trim((string) $request->string('event')) . '%');
        }

        if ($request->filled('actor_id')) {
            $query->where('actor_id', (int) $request->integer('actor_id'));
        }

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $query->paginate(40)->withQueryString(),
            'filters' => [
                'event' => $request->string('event')->toString(),
                'actor_id' => $request->integer('actor_id') ?: null,
            ],
        ]);
    }
}
