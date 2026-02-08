<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order; // Model ရှိရမယ်
use App\Models\ProductVariant;
use App\Models\Shop;  // Model ရှိရမယ်
use App\Models\StaffAttendance;
use App\Models\StockTransfer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;


class DashboardController extends Controller
{
    // app/Http/Controllers/Admin/DashboardController.php

    public function index(Request $request)
    {
        $user = $request->user();

        if ($user && method_exists($user, 'hasRole')) {
            if ($user->hasRole('admin')) {
                $recentOrders = Order::with(['user', 'shop'])
                    ->latest()
                    ->take(10)
                    ->get();

                $from = Carbon::now()->subDays(6)->startOfDay();
                $dailySalesRaw = Order::where('status', '!=', 'cancelled')
                    ->where('created_at', '>=', $from)
                    ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as total'))
                    ->groupBy(DB::raw('DATE(created_at)'))
                    ->orderBy(DB::raw('DATE(created_at)'))
                    ->get()
                    ->keyBy('date');

                $dailySales = collect(range(0, 6))->map(function ($i) use ($dailySalesRaw, $from) {
                    $date = $from->copy()->addDays($i)->toDateString();
                    return [
                        'date' => $date,
                        'label' => Carbon::parse($date)->format('D'),
                        'total' => (float) ($dailySalesRaw[$date]->total ?? 0),
                    ];
                });

                $weeklyAnchor = Carbon::now()->startOfWeek();
                $weeklyFrom = $weeklyAnchor->copy()->subWeeks(7)->startOfDay();
                $weeklyRaw = Order::where('status', '!=', 'cancelled')
                    ->where('created_at', '>=', $weeklyFrom)
                    ->selectRaw('YEARWEEK(created_at, 1) as yw')
                    ->selectRaw('SUM(total_amount) as total')
                    ->groupBy('yw')
                    ->orderBy('yw')
                    ->get()
                    ->keyBy('yw');

                $weeklySales = collect(range(0, 7))->map(function ($i) use ($weeklyRaw, $weeklyAnchor) {
                    $start = $weeklyAnchor->copy()->subWeeks(7 - $i)->startOfWeek();
                    $yw = (int) $start->format('oW');
                    return [
                        'date' => $start->toDateString(),
                        'label' => 'W' . $start->format('W'),
                        'total' => (float) ($weeklyRaw[$yw]->total ?? 0),
                    ];
                });

                $monthlyAnchor = Carbon::now()->startOfMonth();
                $monthlyFrom = $monthlyAnchor->copy()->subMonths(11)->startOfDay();
                $monthlyRaw = Order::where('status', '!=', 'cancelled')
                    ->where('created_at', '>=', $monthlyFrom)
                    ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym")
                    ->selectRaw('SUM(total_amount) as total')
                    ->groupBy('ym')
                    ->orderBy('ym')
                    ->get()
                    ->keyBy('ym');

                $monthlySales = collect(range(0, 11))->map(function ($i) use ($monthlyRaw, $monthlyAnchor) {
                    $month = $monthlyAnchor->copy()->subMonths(11 - $i);
                    $key = $month->format('Y-m');
                    return [
                        'date' => $month->toDateString(),
                        'label' => $month->format('M'),
                        'total' => (float) ($monthlyRaw[$key]->total ?? 0),
                    ];
                });

                $yearlyAnchor = Carbon::now()->startOfYear();
                $yearlyFrom = $yearlyAnchor->copy()->subYears(4)->startOfDay();
                $yearlyRaw = Order::where('status', '!=', 'cancelled')
                    ->where('created_at', '>=', $yearlyFrom)
                    ->selectRaw('YEAR(created_at) as y')
                    ->selectRaw('SUM(total_amount) as total')
                    ->groupBy('y')
                    ->orderBy('y')
                    ->get()
                    ->keyBy('y');

                $yearlySales = collect(range(0, 4))->map(function ($i) use ($yearlyRaw, $yearlyAnchor) {
                    $year = (int) $yearlyAnchor->copy()->subYears(4 - $i)->format('Y');
                    return [
                        'date' => (string) $year,
                        'label' => (string) $year,
                        'total' => (float) ($yearlyRaw[$year]->total ?? 0),
                    ];
                });

                $staffRoles = ['manager', 'sales', 'delivery'];
                $staffUsers = User::with(['roles', 'shop'])
                    ->whereHas('roles', fn ($query) => $query->whereIn('name', $staffRoles))
                    ->orderBy('name')
                    ->get();

                $todayStart = Carbon::now()->startOfDay();
                $weekStart = Carbon::now()->subDays(6)->startOfDay();
                $attendanceRows = StaffAttendance::whereIn('user_id', $staffUsers->pluck('id'))
                    ->where('check_in_at', '>=', $weekStart)
                    ->orderByDesc('check_in_at')
                    ->get()
                    ->groupBy('user_id');

                $teamAttendance = $staffUsers->map(function ($staff) use ($attendanceRows, $todayStart) {
                    $rows = $attendanceRows->get($staff->id, collect());
                    $todayRows = $rows->filter(fn ($row) => $row->check_in_at && $row->check_in_at->gte($todayStart));
                    $todayLatest = $todayRows->first();
                    $weeklyMinutes = (int) $rows->sum(function ($row) {
                        if ($row->check_out_at) {
                            return (int) $row->worked_minutes;
                        }

                        return (int) $row->check_in_at->diffInMinutes(now());
                    });
                    $todayMinutes = (int) $todayRows->sum(function ($row) {
                        if ($row->check_out_at) {
                            return (int) $row->worked_minutes;
                        }

                        return (int) $row->check_in_at->diffInMinutes(now());
                    });

                    return [
                        'id' => $staff->id,
                        'name' => $staff->name,
                        'role' => $staff->roles->pluck('name')->first(),
                        'shop' => $staff->shop?->name,
                        'checked_in' => (bool) ($todayLatest && $todayLatest->check_out_at === null),
                        'check_in_at' => $todayLatest?->check_in_at?->toDateTimeString(),
                        'check_out_at' => $todayLatest?->check_out_at?->toDateTimeString(),
                        'today_worked_minutes' => $todayMinutes,
                        'weekly_worked_minutes' => $weeklyMinutes,
                        'met_daily_target' => $todayMinutes >= 480,
                    ];
                })->values();

                $stats = [
                    'total_sales' => number_format((float) Order::sum('total_amount')),
                    'active_shops' => Shop::count(),
                    'total_orders' => Order::count(),
                    'system_users' => User::count(),
                    'checked_in_staff' => $teamAttendance->where('checked_in', true)->count(),
                ];

                $stockByShop = Shop::query()
                    ->leftJoin('products', 'products.shop_id', '=', 'shops.id')
                    ->leftJoin('product_variants', function ($join) {
                        $join->on('product_variants.product_id', '=', 'products.id')
                            ->where('product_variants.is_active', true);
                    })
                    ->groupBy('shops.id', 'shops.name')
                    ->orderBy('shops.name')
                    ->get([
                        'shops.id',
                        'shops.name',
                        DB::raw('COALESCE(SUM(product_variants.stock_level), 0) as total_stock'),
                        DB::raw('SUM(CASE WHEN product_variants.stock_level <= 5 THEN 1 ELSE 0 END) as low_stock_variants'),
                    ])
                    ->map(fn ($row) => [
                        'id' => (int) $row->id,
                        'shop' => $row->name,
                        'total_stock' => (int) $row->total_stock,
                        'low_stock_variants' => (int) $row->low_stock_variants,
                    ])
                    ->values();

                $transferFrom = Carbon::now()->subDays(6)->startOfDay();
                $transferRaw = StockTransfer::where('created_at', '>=', $transferFrom)
                    ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(quantity) as qty'))
                    ->groupBy(DB::raw('DATE(created_at)'))
                    ->orderBy(DB::raw('DATE(created_at)'))
                    ->get()
                    ->keyBy('date');

                $transferTrend = collect(range(0, 6))->map(function ($i) use ($transferRaw, $transferFrom) {
                    $date = $transferFrom->copy()->addDays($i)->toDateString();
                    return [
                        'date' => $date,
                        'qty' => (int) ($transferRaw[$date]->qty ?? 0),
                    ];
                });

                return inertia('Admin/Dashboard', [
                    'stats' => $stats,
                    'recentOrders' => $recentOrders,
                    'dailySales' => $dailySales,
                    'salesTrends' => [
                        'daily' => $dailySales,
                        'weekly' => $weeklySales,
                        'monthly' => $monthlySales,
                        'yearly' => $yearlySales,
                    ],
                    'teamAttendance' => $teamAttendance,
                    'stockByShop' => $stockByShop,
                    'transferTrend' => $transferTrend,
                ]);
            }

            if ($user->hasRole('manager')) {
                $shopId = $user->shop_id;

                $recentOrders = Order::with(['user', 'shop'])
                    ->where('shop_id', $shopId)
                    ->latest()
                    ->take(10)
                    ->get();

                $from = Carbon::now()->subDays(6)->startOfDay();
                $dailySalesRaw = Order::where('shop_id', $shopId)
                    ->where('status', '!=', 'cancelled')
                    ->where('created_at', '>=', $from)
                    ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as total'))
                    ->groupBy(DB::raw('DATE(created_at)'))
                    ->orderBy(DB::raw('DATE(created_at)'))
                    ->get()
                    ->keyBy('date');

                $dailySales = collect(range(0, 6))->map(function ($i) use ($dailySalesRaw, $from) {
                    $date = $from->copy()->addDays($i)->toDateString();
                    return [
                        'date' => $date,
                        'total' => (float) ($dailySalesRaw[$date]->total ?? 0),
                    ];
                });

                $shopOrderStats = Order::where('shop_id', $shopId)
                    ->selectRaw('COALESCE(SUM(total_amount), 0) as shop_sales')
                    ->selectRaw('COUNT(*) as total_orders')
                    ->selectRaw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders")
                    ->first();

                return inertia('Admin/ManagerDashboard', [
                    'shop' => Shop::find($shopId),
                    'stats' => [
                        'shop_sales' => number_format((float) ($shopOrderStats->shop_sales ?? 0)),
                        'total_orders' => (int) ($shopOrderStats->total_orders ?? 0),
                        'pending_orders' => (int) ($shopOrderStats->pending_orders ?? 0),
                        'team_members' => User::where('shop_id', $shopId)->count(),
                    ],
                    'recentOrders' => $recentOrders,
                    'dailySales' => $dailySales,
                ]);
            }

            if ($user->hasRole('sales')) {
                $shopId = $user->shop_id;
                $today = now()->startOfDay();
                $todayString = $today->toDateTimeString();

                $salesStats = Order::where('shop_id', $shopId)
                    ->selectRaw("SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as today_orders", [$todayString])
                    ->selectRaw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders")
                    ->selectRaw("SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders")
                    ->selectRaw("COALESCE(SUM(CASE WHEN created_at >= ? THEN total_amount ELSE 0 END), 0) as today_sales", [$todayString])
                    ->first();

                return inertia('Admin/SalesDashboard', [
                    'shop' => Shop::find($shopId),
                    'stats' => [
                        'today_orders' => (int) ($salesStats->today_orders ?? 0),
                        'pending_orders' => (int) ($salesStats->pending_orders ?? 0),
                        'confirmed_orders' => (int) ($salesStats->confirmed_orders ?? 0),
                        'today_sales' => number_format((float) ($salesStats->today_sales ?? 0)),
                    ],
                    'recentOrders' => Order::with(['user', 'shop'])
                        ->where('shop_id', $shopId)
                        ->latest()
                        ->take(10)
                        ->get(),
                ]);
            }

            if ($user->hasRole('delivery')) {
                $shopId = $user->shop_id;
                $deliveryQuery = Order::with(['user', 'shop'])
                    ->when($shopId, fn ($q) => $q->where('shop_id', $shopId));
                $todayDate = now()->toDateString();

                $deliveryStatsQuery = Order::query()->when($shopId, fn ($q) => $q->where('shop_id', $shopId));
                $deliveryStats = $deliveryStatsQuery
                    ->selectRaw("SUM(CASE WHEN status IN ('confirmed', 'shipped') THEN 1 ELSE 0 END) as assigned_orders")
                    ->selectRaw("SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as in_transit")
                    ->selectRaw("SUM(CASE WHEN DATE(delivered_at) = ? THEN 1 ELSE 0 END) as delivered_today", [$todayDate])
                    ->selectRaw("SUM(CASE WHEN status = 'shipped' AND delivery_updated_at IS NULL THEN 1 ELSE 0 END) as location_updates_needed")
                    ->first();

                return inertia('Admin/DeliveryDashboard', [
                    'shop' => $shopId ? Shop::find($shopId) : null,
                    'stats' => [
                        'assigned_orders' => (int) ($deliveryStats->assigned_orders ?? 0),
                        'in_transit' => (int) ($deliveryStats->in_transit ?? 0),
                        'delivered_today' => (int) ($deliveryStats->delivered_today ?? 0),
                        'location_updates_needed' => (int) ($deliveryStats->location_updates_needed ?? 0),
                    ],
                    'deliveryOrders' => (clone $deliveryQuery)
                        ->whereIn('status', ['confirmed', 'shipped', 'delivered'])
                        ->latest()
                        ->take(12)
                        ->get(),
                ]);
            }
        }

        // 🎯 သာမန် User ဖြစ်ရင် Pages/Dashboard.jsx ဆီ ပို့မယ်
        $recentOrders = Order::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get();

        return inertia('Dashboard', [
            'orderCount' => Order::where('user_id', $user->id)->count(),
            'recentOrders' => $recentOrders,
        ]);
    }
}
