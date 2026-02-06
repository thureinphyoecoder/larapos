<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
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

        $users = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'type' => $type,
            'search' => $search,
            'roles' => Role::orderBy('name')->pluck('name'),
            'shops' => Shop::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $roles = Role::pluck('name')->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
            'role' => 'required|in:' . implode(',', $roles),
            'shop_id' => 'nullable|exists:shops,id',
        ]);

        $staffRoles = ['manager', 'sales', 'delivery'];
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
        $roles = Role::pluck('name')->toArray();

        $validated = $request->validate([
            'role' => 'required|in:' . implode(',', $roles),
            'shop_id' => 'nullable|exists:shops,id',
        ]);

        $staffRoles = ['manager', 'sales', 'delivery'];
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
        $user->delete();
        return back()->with('success', 'User deleted.');
    }
}
