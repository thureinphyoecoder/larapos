<?php

namespace App\Support\Payroll;

use App\Models\PayrollAdjustment;
use App\Models\PayrollPayout;
use App\Models\StaffAttendance;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class PayrollCalculator
{
    public function calculate(Collection $users, string $month): Collection
    {
        [$from, $to] = $this->monthRange($month);
        $userIds = $users->pluck('id')->filter()->values();
        if ($userIds->isEmpty()) {
            return collect();
        }

        $attendanceRows = StaffAttendance::query()
            ->whereIn('user_id', $userIds)
            ->whereBetween('check_in_at', [$from, $to])
            ->get(['id', 'user_id', 'check_in_at', 'check_out_at', 'worked_minutes'])
            ->groupBy('user_id');

        $adjustments = PayrollAdjustment::query()
            ->whereIn('user_id', $userIds)
            ->whereDate('effective_date', '<=', $to->toDateString())
            ->get(['id', 'user_id', 'type', 'amount', 'reason', 'effective_date', 'is_recurring'])
            ->groupBy('user_id');

        $payouts = PayrollPayout::query()
            ->whereIn('user_id', $userIds)
            ->where('period_month', $month)
            ->get(['id', 'user_id', 'gross_amount', 'deduction_amount', 'net_amount', 'status', 'paid_at'])
            ->keyBy('user_id');

        $expectedWorkingDays = $this->expectedWorkingDays($from, $to);

        return $users->map(function ($user) use ($attendanceRows, $adjustments, $payouts, $from, $to, $expectedWorkingDays) {
            $profile = $user->payrollProfile;
            $baseSalary = (float) ($profile?->base_salary ?? 0);
            $allowance = (float) ($profile?->allowance ?? 0);
            $bonusPerDay = (float) ($profile?->attendance_bonus_per_day ?? 0);
            $absenceDeduction = (float) ($profile?->absence_deduction_per_day ?? 0);
            $performanceBonus = (float) ($profile?->performance_bonus ?? 0);
            $overtimeRatePerHour = (float) ($profile?->overtime_rate_per_hour ?? 0);

            $attRows = $attendanceRows->get($user->id, collect());
            $attendanceDays = $attRows
                ->pluck('check_in_at')
                ->filter()
                ->map(fn ($ts) => Carbon::parse($ts)->toDateString())
                ->unique()
                ->count();
            $workedMinutes = (int) $attRows->sum(function ($row) {
                if (!empty($row->check_out_at)) {
                    return (int) $row->worked_minutes;
                }

                return (int) Carbon::parse($row->check_in_at)->diffInMinutes(now());
            });

            $absenceDays = max(0, $expectedWorkingDays - $attendanceDays);
            $attendanceBonusTotal = $attendanceDays * $bonusPerDay;
            $absenceDeductionTotal = $absenceDays * $absenceDeduction;

            $targetMinutes = $expectedWorkingDays * 8 * 60;
            $performanceBonusTotal = $workedMinutes >= $targetMinutes ? $performanceBonus : 0;
            $overtimeMinutes = max(0, $workedMinutes - $targetMinutes);
            $overtimeHours = round($overtimeMinutes / 60, 2);
            $overtimePay = round($overtimeHours * $overtimeRatePerHour, 2);

            $monthAdjustments = ($adjustments->get($user->id, collect()))
                ->filter(function ($row) use ($from, $to): bool {
                    if ($row->is_recurring) {
                        return true;
                    }

                    return Carbon::parse($row->effective_date)->between($from, $to, true);
                });

            $manualBonus = (float) $monthAdjustments->whereIn('type', ['bonus', 'increment', 'allowance'])->sum('amount');
            $manualDeduction = (float) $monthAdjustments->where('type', 'deduction')->sum('amount');

            $gross = $baseSalary + $allowance + $attendanceBonusTotal + $performanceBonusTotal + $overtimePay + $manualBonus;
            $deduction = $absenceDeductionTotal + $manualDeduction;
            $net = max(0, $gross - $deduction);

            $payout = $payouts->get($user->id);

            return [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles?->pluck('name')->first(),
                'shop' => $user->shop?->name,
                'payroll_profile' => [
                    'base_salary' => $baseSalary,
                    'allowance' => $allowance,
                    'attendance_bonus_per_day' => $bonusPerDay,
                    'absence_deduction_per_day' => $absenceDeduction,
                    'performance_bonus' => $performanceBonus,
                    'overtime_rate_per_hour' => $overtimeRatePerHour,
                ],
                'attendance' => [
                    'days' => $attendanceDays,
                    'expected_days' => $expectedWorkingDays,
                    'absence_days' => $absenceDays,
                    'worked_minutes' => $workedMinutes,
                    'target_minutes' => $targetMinutes,
                    'overtime_minutes' => $overtimeMinutes,
                    'overtime_hours' => $overtimeHours,
                ],
                'totals' => [
                    'base_salary' => $baseSalary,
                    'allowance' => $allowance,
                    'attendance_bonus' => $attendanceBonusTotal,
                    'performance_bonus' => $performanceBonusTotal,
                    'overtime_pay' => $overtimePay,
                    'manual_bonus' => $manualBonus,
                    'absence_deduction' => $absenceDeductionTotal,
                    'manual_deduction' => $manualDeduction,
                    'gross' => $gross,
                    'deduction' => $deduction,
                    'net' => $net,
                ],
                'slip' => [
                    'period' => $from->format('F Y'),
                    'worked_days' => $attendanceDays,
                    'expected_days' => $expectedWorkingDays,
                    'overtime_hours' => $overtimeHours,
                    'attendance_bonus' => $attendanceBonusTotal,
                    'bonus_total' => $performanceBonusTotal + $manualBonus + $overtimePay,
                    'deduction_total' => $deduction,
                    'net_salary' => $net,
                ],
                'payout' => $payout ? [
                    'id' => $payout->id,
                    'status' => $payout->status,
                    'paid_at' => optional($payout->paid_at)->toDateTimeString(),
                    'net_amount' => (float) $payout->net_amount,
                ] : null,
            ];
        })->values();
    }

    public function monthRange(string $month): array
    {
        $from = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $to = $from->copy()->endOfMonth();

        return [$from, $to];
    }

    public function normalizeMonth(string $month): string
    {
        $month = trim($month);
        if ($month === '') {
            return now()->format('Y-m');
        }

        if (preg_match('/^\d{4}-\d{1,2}$/', $month) === 1 || preg_match('/^\d{4}\/\d{1,2}$/', $month) === 1) {
            [$year, $numericMonth] = preg_split('/[-\/]/', $month);
            $year = (int) $year;
            $numericMonth = (int) $numericMonth;

            if ($year > 0 && $numericMonth >= 1 && $numericMonth <= 12) {
                return sprintf('%04d-%02d', $year, $numericMonth);
            }
        }

        try {
            return Carbon::parse($month)->format('Y-m');
        } catch (\Throwable) {
            return now()->format('Y-m');
        }
    }

    public function expectedWorkingDays(Carbon $from, Carbon $to): int
    {
        $days = 0;
        $current = $from->copy();
        while ($current->lte($to)) {
            if (!$current->isSunday()) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }
}
