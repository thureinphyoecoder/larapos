<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order; // Model ရှိရမယ်
use App\Models\Shop;  // Model ရှိရမယ်
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;


class DashboardController extends Controller
{
    // app/Http/Controllers/Admin/DashboardController.php

    public function index(Request $request)
    {
        $user = $request->user();

        // 🎯 Admin/Staff ဖြစ်ရင် Admin Folder ထဲက Dashboard ဆီ ပို့မယ်
        $isStaff = $user && method_exists($user, 'hasAnyRole')
            ? $user->hasAnyRole(['admin', 'manager', 'sales'])
            : false;

        if ($isStaff) {
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
                    'total' => (float) ($dailySalesRaw[$date]->total ?? 0),
                ];
            });

            $stats = [
                'total_sales' => number_format((float) Order::sum('total_amount')),
                'active_shops' => Shop::count(),
                'total_orders' => Order::count(),
                'system_users' => User::count(),
            ];

            return inertia('Admin/Dashboard', [
                'stats' => $stats,
                'recentOrders' => $recentOrders,
                'dailySales' => $dailySales,
            ]);
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
