<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\StaffAttendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $actor = $request->user();
        $staffRoles = ['admin', 'manager', 'sales', 'delivery'];
        $type = $request->get('type', 'staff');
        $search = trim((string) $request->get('search', ''));

        $query = User::with(['roles', 'shop'])->orderByDesc('id');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($type === 'customers') {
            $query->whereDoesntHave('roles', function ($q) use ($staffRoles) {
                $q->whereIn('name', $staffRoles);
            });
        } else {
            $query->whereHas('roles', function ($q) use ($staffRoles) {
                $q->whereIn('name', $staffRoles);
            });
        }

        if ($actor?->hasRole('manager')) {
            $query->where('shop_id', $actor->shop_id)
                ->whereHas('roles', function ($q) {
                    $q->whereIn('name', ['sales', 'delivery']);
                });
        }

        $users = $query->paginate(10)->withQueryString();

        $todayStart = Carbon::now()->startOfDay();
        $staffRows = collect($users->items());
        $staffIds = $staffRows->pluck('id')->all();

        $todayAttendance = empty($staffIds)
            ? collect()
            : StaffAttendance::whereIn('user_id', $staffIds)
                ->where('check_in_at', '>=', $todayStart)
                ->orderByDesc('check_in_at')
                ->get()
                ->groupBy('user_id');

        $users->setCollection(
            $staffRows->map(function ($user) use ($todayAttendance) {
                $latest = optional($todayAttendance->get($user->id))->first();
                $activeMinutes = 0;

                if ($latest) {
                    $activeMinutes = $latest->check_out_at
                        ? (int) $latest->worked_minutes
                        : (int) $latest->check_in_at->diffInMinutes(now());
                }

                $user->setAttribute('attendance_today', [
                    'checked_in' => (bool) ($latest && $latest->check_out_at === null),
                    'check_in_at' => $latest?->check_in_at?->toDateTimeString(),
                    'check_out_at' => $latest?->check_out_at?->toDateTimeString(),
                    'worked_minutes' => $activeMinutes,
                ]);

                return $user;
            }),
        );

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'type' => $type,
            'search' => $search,
            'roles' => collect($this->allowedRolesFor($actor)),
            'shops' => Shop::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()?->hasAnyRole(['admin', 'manager']), 403);
        $roles = $this->allowedRolesFor($request->user());

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
            'role' => 'required|in:' . implode(',', $roles),
            'shop_id' => 'nullable|exists:shops,id',
        ]);

        $staffRoles = ['manager', 'sales', 'delivery', 'cashier', 'accountant', 'technician'];
        if (in_array($validated['role'], $staffRoles, true) && empty($validated['shop_id'])) {
            return back()->withErrors(['shop_id' => 'Staff role သတ်မှတ်ထားရင် shop လည်းရွေးပေးပါ။']);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password'] ?? 'password'),
            'shop_id' => in_array($validated['role'], $staffRoles, true) ? $validated['shop_id'] : null,
            'email_verified_at' => now(),
        ]);

        $user->syncRoles([$validated['role']]);

        return redirect()->route('admin.users.index')->with('success', 'Staff user created.');
    }

    public function update(Request $request, User $user)
    {
        abort_unless($request->user()?->hasAnyRole(['admin', 'manager']), 403);
        $roles = $this->allowedRolesFor($request->user());

        $validated = $request->validate([
            'role' => 'required|in:' . implode(',', $roles),
            'shop_id' => 'nullable|exists:shops,id',
        ]);

        if ($request->user()?->hasRole('manager') && $user->hasAnyRole(['admin', 'manager'])) {
            return back()->withErrors(['role' => 'Manager cannot modify admin/manager accounts.']);
        }

        $staffRoles = ['manager', 'sales', 'delivery', 'cashier', 'accountant', 'technician'];
        if (in_array($validated['role'], $staffRoles, true) && empty($validated['shop_id'])) {
            return back()->withErrors(['shop_id' => 'Staff role သတ်မှတ်ထားရင် shop လည်းရွေးပေးပါ။']);
        }

        $user->syncRoles([$validated['role']]);
        $user->shop_id = in_array($validated['role'], $staffRoles, true) ? $validated['shop_id'] : null;
        $user->save();

        return back()->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
        abort_unless($user->id !== auth()->id(), 422, 'You cannot delete yourself.');
        abort_unless(request()->user()?->hasRole('admin'), 403);

        if ($user->hasRole('admin')) {
            return back()->withErrors(['user' => 'Admin account cannot be deleted from this panel.']);
        }

        $user->delete();
        return back()->with('success', 'User deleted.');
    }

    private function allowedRolesFor(?User $actor): array
    {
        if ($actor?->hasRole('admin')) {
            return Role::orderBy('name')->pluck('name')->all();
        }

        if ($actor?->hasRole('manager')) {
            return ['sales', 'delivery', 'cashier', 'technician'];
        }

        return [];
    }
}
