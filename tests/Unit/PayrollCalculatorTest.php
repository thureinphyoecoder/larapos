<?php

namespace Tests\Unit;

use App\Support\Payroll\PayrollCalculator;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PayrollCalculatorTest extends TestCase
{
    public function test_expected_working_days_changes_by_month(): void
    {
        $calculator = new PayrollCalculator();

        [$febFrom, $febTo] = $calculator->monthRange('2026-02');
        [$marFrom, $marTo] = $calculator->monthRange('2026-03');

        $febWorkingDays = $calculator->expectedWorkingDays($febFrom, $febTo);
        $marWorkingDays = $calculator->expectedWorkingDays($marFrom, $marTo);

        $this->assertSame(24, $febWorkingDays);
        $this->assertSame(26, $marWorkingDays);
        $this->assertNotSame($febWorkingDays, $marWorkingDays);
    }

    public function test_normalize_month_accepts_flexible_formats(): void
    {
        Carbon::setTestNow('2026-02-11 12:00:00');

        $calculator = new PayrollCalculator();

        $this->assertSame('2026-02', $calculator->normalizeMonth('2026-2'));
        $this->assertSame('2026-03', $calculator->normalizeMonth('2026/3'));
        $this->assertSame('2026-04', $calculator->normalizeMonth('2026-04-15'));
        $this->assertSame('2026-02', $calculator->normalizeMonth(''));

        Carbon::setTestNow();
    }
}

