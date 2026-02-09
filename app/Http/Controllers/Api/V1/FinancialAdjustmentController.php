<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\FinancialAdjustment;
use App\Models\Order;
use App\Services\Governance\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinancialAdjustmentController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
    ) {
    }

    public function store(Request $request, Order $order): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor && $actor->hasAnyRole(['admin', 'manager', 'accountant']), 403);

        $validated = $request->validate([
            'adjustment_type' => ['required', 'in:reversal,adjustment'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'max:255'],
            'approval_request_id' => ['nullable', 'integer', 'exists:approval_requests,id'],
            'meta' => ['nullable', 'array'],
        ]);

        $approvalId = $validated['approval_request_id'] ?? null;
        if ($approvalId) {
            $approved = ApprovalRequest::query()
                ->whereKey($approvalId)
                ->where('order_id', $order->id)
                ->where('status', 'approved')
                ->exists();

            if (! $approved) {
                return response()->json(['message' => 'Approval request is not approved for this order.'], 422);
            }
        }

        $adjustment = FinancialAdjustment::query()->create([
            'order_id' => $order->id,
            'adjustment_type' => $validated['adjustment_type'],
            'amount' => $validated['amount'],
            'reason' => $validated['reason'],
            'created_by' => $actor->id,
            'approval_request_id' => $approvalId,
            'meta' => $validated['meta'] ?? null,
        ]);

        $this->auditLogger->log(
            event: 'finance.adjustment_created',
            auditable: $adjustment,
            new: [
                'order_id' => $order->id,
                'adjustment_type' => $adjustment->adjustment_type,
                'amount' => (float) $adjustment->amount,
            ],
            actor: $actor,
        );

        return response()->json([
            'message' => 'Financial adjustment recorded. Ledger is immutable.',
            'data' => $adjustment,
        ], 201);
    }
}
