<?php

namespace App\Http\Middleware;

use App\Models\StaffAttendance;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    // app/Http/Middleware/HandleInertiaRequests.php

    public function share(Request $request): array
    {
        $user = $request->user();
        $role = $user ? ($user->roles->pluck('name')->first() ?? 'user') : null;
        $attendance = null;

        if ($user && in_array($role, ['admin', 'manager', 'sales', 'delivery'], true)) {
            $openShift = StaffAttendance::where('user_id', $user->id)
                ->whereNull('check_out_at')
                ->latest('check_in_at')
                ->first();

            $todayShift = StaffAttendance::where('user_id', $user->id)
                ->where('check_in_at', '>=', Carbon::now()->startOfDay())
                ->latest('check_in_at')
                ->first();

            $attendance = [
                'is_checked_in' => (bool) $openShift,
                'active_minutes' => $openShift ? $openShift->check_in_at->diffInMinutes(now()) : 0,
                'today_worked_minutes' => $todayShift
                    ? ($todayShift->check_out_at
                        ? (int) $todayShift->worked_minutes
                        : (int) $todayShift->check_in_at->diffInMinutes(now()))
                    : 0,
                'last_check_in_at' => $todayShift?->check_in_at?->toDateTimeString(),
                'last_check_out_at' => $todayShift?->check_out_at?->toDateTimeString(),
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ] : null,
                'role' => $role,
            ],
            'attendance' => $attendance,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
