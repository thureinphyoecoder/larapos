<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'accountant']), 403);

        $query = AuditLog::query()->with('actor:id,name,email')->latest('id');

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
