<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\Order;
use App\Services\Governance\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalRequestController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
    ) {
    }

    public function store(Request $request, Order $order): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor && $actor->hasAnyRole(['admin', 'manager', 'cashier', 'sales', 'accountant', 'technician']), 403);

        $validated = $request->validate([
            'request_type' => ['required', 'in:discount,refund'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'reason' => ['required', 'string', 'max:255'],
            'payload' => ['nullable', 'array'],
        ]);

        $approval = ApprovalRequest::query()->create([
            'request_type' => $validated['request_type'],
            'order_id' => $order->id,
            'requested_by' => $actor->id,
            'amount' => $validated['amount'] ?? null,
            'reason' => $validated['reason'],
            'payload' => $validated['payload'] ?? null,
            'status' => 'pending',
        ]);

        $this->auditLogger->log(
            event: 'approval.requested',
            auditable: $approval,
            new: [
                'request_type' => $approval->request_type,
                'order_id' => $approval->order_id,
                'status' => $approval->status,
            ],
            actor: $actor,
        );

        return response()->json([
            'message' => 'Approval request submitted.',
            'data' => $approval,
        ], 201);
    }

    public function approve(Request $request, ApprovalRequest $approvalRequest): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor && $actor->hasAnyRole(['admin', 'manager', 'accountant']), 403);

        if ($approvalRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved.'], 422);
        }

        $approvalRequest->update([
            'status' => 'approved',
            'approved_by' => $actor->id,
            'approved_at' => now(),
        ]);

        $this->auditLogger->log(
            event: 'approval.approved',
            auditable: $approvalRequest,
            old: ['status' => 'pending'],
            new: ['status' => 'approved'],
            actor: $actor,
        );

        return response()->json([
            'message' => 'Approval granted.',
            'data' => $approvalRequest,
        ]);
    }

    public function reject(Request $request, ApprovalRequest $approvalRequest): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor && $actor->hasAnyRole(['admin', 'manager', 'accountant']), 403);

        if ($approvalRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be rejected.'], 422);
        }

        $approvalRequest->update([
            'status' => 'rejected',
            'approved_by' => $actor->id,
            'rejected_at' => now(),
        ]);

        $this->auditLogger->log(
            event: 'approval.rejected',
            auditable: $approvalRequest,
            old: ['status' => 'pending'],
            new: ['status' => 'rejected'],
            actor: $actor,
        );

        return response()->json([
            'message' => 'Approval rejected.',
            'data' => $approvalRequest,
        ]);
    }
}
