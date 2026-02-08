<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffAttendance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StaffAttendanceController extends Controller
{
    public function checkIn(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'sales', 'delivery']), 403);

        $openShift = StaffAttendance::where('user_id', $user->id)
            ->whereNull('check_out_at')
            ->latest('check_in_at')
            ->first();

        if ($openShift) {
            return back()->with('error', 'You are already checked in. Please check out first.');
        }

        StaffAttendance::create([
            'user_id' => $user->id,
            'check_in_at' => now(),
            'check_in_ip' => $request->ip(),
        ]);

        return back()->with('success', 'Checked in successfully.');
    }

    public function checkOut(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'sales', 'delivery']), 403);

        $openShift = StaffAttendance::where('user_id', $user->id)
            ->whereNull('check_out_at')
            ->latest('check_in_at')
            ->first();

        if (!$openShift) {
            return back()->with('error', 'No active check-in found.');
        }

        $checkOutTime = now();
        $workedMinutes = max(0, $openShift->check_in_at->diffInMinutes($checkOutTime));

        $openShift->update([
            'check_out_at' => $checkOutTime,
            'worked_minutes' => $workedMinutes,
            'check_out_ip' => $request->ip(),
        ]);

        return back()->with('success', 'Checked out successfully.');
    }
}
