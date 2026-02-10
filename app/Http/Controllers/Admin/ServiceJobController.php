<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ServiceJobController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'accountant']), 403);

        $jobs = DB::table('jobs')
            ->orderByDesc('id')
            ->limit(50)
            ->get(['id', 'queue', 'attempts', 'available_at', 'created_at']);

        $failedJobs = DB::table('failed_jobs')
            ->orderByDesc('id')
            ->limit(50)
            ->get(['id', 'uuid', 'connection', 'queue', 'failed_at']);

        $batches = DB::table('job_batches')
            ->orderByDesc('created_at')
            ->limit(30)
            ->get(['id', 'name', 'total_jobs', 'pending_jobs', 'failed_jobs', 'created_at', 'finished_at']);

        return Inertia::render('Admin/ServiceJobs/Index', [
            'jobs' => $jobs,
            'failedJobs' => $failedJobs,
            'batches' => $batches,
            'stats' => [
                'queued' => DB::table('jobs')->count(),
                'failed' => DB::table('failed_jobs')->count(),
                'batches' => DB::table('job_batches')->count(),
            ],
        ]);
    }

    public function retryFailed(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager']), 403);

        $validated = $request->validate([
            'failed_job_id' => ['required', 'integer', 'exists:failed_jobs,id'],
        ]);

        Artisan::call('queue:retry', ['id' => [(string) $validated['failed_job_id']]]);

        return back()->with('success', 'Failed job retry dispatched.');
    }

    public function runDailyClose(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'accountant']), 403);

        $validated = $request->validate([
            'date' => ['nullable', 'date'],
            'shop_id' => ['nullable', 'integer', 'exists:shops,id'],
        ]);

        $arguments = [
            '--date' => $validated['date'] ?? now()->toDateString(),
            '--closed_by' => (string) $user->id,
        ];

        if (!empty($validated['shop_id'])) {
            $arguments['--shop_id'] = [(string) $validated['shop_id']];
        }

        Artisan::call('pos:daily-close', $arguments);

        return back()->with('success', 'Daily close executed.');
    }
}
