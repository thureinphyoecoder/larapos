<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Orders\CreateOrderFromCartAction;
use App\Actions\Orders\CreateOrderFromItemsAction;
use App\Actions\Orders\RestockOrderItemsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Orders\StoreOrderRequest;
use App\Http\Requests\Api\V1\Orders\UpdateOrderStatusRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\ApprovalRequest;
use App\Models\Order;
use App\Services\Governance\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class OrderController extends Controller
{
    public function __construct(
        private readonly CreateOrderFromCartAction $createOrderFromCartAction,
        private readonly CreateOrderFromItemsAction $createOrderFromItemsAction,
        private readonly RestockOrderItemsAction $restockOrderItemsAction,
        private readonly AuditLogger $auditLogger,
    ) {
    }

    public function index(): JsonResponse
    {
        $user = request()->user();
        $isStaff = $user->hasAnyRole(['admin', 'manager', 'sales', 'delivery', 'cashier', 'accountant', 'technician']);

        $orders = Order::query()
            ->with($this->orderRelations())
            ->when(! $isStaff, fn ($q) => $q->where('user_id', $user->id))
            ->latest('id')
            ->paginate((int) request('per_page', 20))
            ->withQueryString();

        return response()->json([
            'data' => OrderResource::collection($orders->getCollection()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Order $order): JsonResponse
    {
        $user = request()->user();
        $isStaff = $user->hasAnyRole(['admin', 'manager', 'sales', 'delivery', 'cashier', 'accountant', 'technician']);

        if (! $isStaff && (int) $order->user_id !== (int) $user->id) {
            abort(403);
        }

        return response()->json([
            'data' => new OrderResource($order->load($this->orderRelations())),
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $user = $request->user();
        $isItemsCheckout = $request->filled('items');
        $resolvedShopId = $request->integer('shop_id') ?: ($user->shop_id ?: null);
        $idempotencyKey = trim((string) $request->header('X-Idempotency-Key'));
        if ($idempotencyKey !== '' && strlen($idempotencyKey) > 120) {
            return response()->json([
                'message' => 'X-Idempotency-Key must be 120 characters or fewer.',
            ], 422);
        }
        $idempotencyKey = $idempotencyKey !== '' ? $idempotencyKey : null;

        if ($idempotencyKey) {
            $existingOrder = Order::query()
                ->where('user_id', $user->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existingOrder) {
                return response()->json([
                    'message' => 'Order already processed for this idempotency key.',
                    'data' => new OrderResource($existingOrder->load($this->orderRelations())),
                ]);
            }
        }

        $order = $isItemsCheckout
            ? $this->createOrderFromItemsAction->execute(
                user: $user,
                items: $request->input('items', []),
                phone: $request->input('phone'),
                address: $request->input('address'),
                customerName: $request->string('customer_name')->toString() ?: null,
                customerId: $request->integer('customer_id') ?: null,
                forcedShopId: $resolvedShopId,
                paymentSlip: $request->file('payment_slip'),
                idempotencyKey: $idempotencyKey,
            )
            : $this->createOrderFromCartAction->execute(
                user: $user,
                phone: $request->input('phone'),
                address: $request->input('address'),
                shopId: $resolvedShopId,
                paymentSlip: $request->file('payment_slip'),
                idempotencyKey: $idempotencyKey,
            );

        // Cart checkout can split into multiple shop orders and broadcasts inside action.
        if ($isItemsCheckout) {
            event(new \App\Events\NewOrderPlaced($order));
        }

        return response()->json([
            'message' => 'Order created successfully.',
            'data' => new OrderResource($order),
        ], 201);
    }

    public function customerCancel(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();
        $isStaff = $user->hasAnyRole(['admin', 'manager', 'sales', 'delivery', 'cashier', 'accountant', 'technician']);

        if ($isStaff || (int) $order->user_id !== (int) $user->id) {
            abort(403);
        }

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending orders can be cancelled.',
            ], 422);
        }

        $validated = $request->validate([
            'cancel_reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $order->update([
            'status' => 'cancelled',
            'cancel_reason' => $validated['cancel_reason'],
            'cancelled_at' => now(),
        ]);

        $this->restockOrderItemsAction->execute($order);
        event(new \App\Events\OrderStatusUpdated($order));

        return response()->json([
            'message' => 'Order cancelled.',
            'data' => new OrderResource($order->load($this->orderRelations())),
        ]);
    }

    public function requestRefund(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();
        $isStaff = $user->hasAnyRole(['admin', 'manager', 'sales', 'delivery', 'cashier', 'accountant', 'technician']);

        if ($isStaff || (int) $order->user_id !== (int) $user->id) {
            abort(403);
        }

        if (! $order->payment_slip) {
            return response()->json([
                'message' => 'Payment slip required for refund.',
            ], 422);
        }

        if (! in_array($order->status, ['confirmed', 'shipped'], true)) {
            return response()->json([
                'message' => 'Refund not available for this status.',
            ], 422);
        }

        $order->update([
            'status' => 'refund_requested',
            'refund_requested_at' => now(),
        ]);

        event(new \App\Events\OrderStatusUpdated($order));

        return response()->json([
            'message' => 'Refund requested.',
            'data' => new OrderResource($order->load($this->orderRelations())),
        ]);
    }

    public function requestReturn(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();
        $isStaff = $user->hasAnyRole(['admin', 'manager', 'sales', 'delivery', 'cashier', 'accountant', 'technician']);

        if ($isStaff || (int) $order->user_id !== (int) $user->id) {
            abort(403);
        }

        if ($order->status !== 'delivered') {
            return response()->json([
                'message' => 'Return available only after delivered.',
            ], 422);
        }

        if ($order->delivered_at && now()->diffInDays($order->delivered_at) > 7) {
            return response()->json([
                'message' => 'Return window expired (7 days).',
            ], 422);
        }

        $validated = $request->validate([
            'return_reason' => ['required', 'string', 'max:500'],
        ]);

        $order->update([
            'status' => 'return_requested',
            'return_requested_at' => now(),
            'return_reason' => $validated['return_reason'],
        ]);

        event(new \App\Events\OrderStatusUpdated($order));

        return response()->json([
            'message' => 'Return requested.',
            'data' => new OrderResource($order->load($this->orderRelations())),
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $actor = $request->user();
        $previousStatus = $order->status;
        $nextStatus = $request->string('status')->toString();
        $approvalRequestId = $request->integer('approval_request_id') ?: null;
        $this->authorizeStaffOrderAccess($actor, $order);

        if ($actor?->hasRole('delivery') && ! in_array($nextStatus, ['shipped', 'delivered'], true)) {
            return response()->json([
                'message' => 'Delivery staff can only update to shipped or delivered.',
            ], 403);
        }

        if ($nextStatus === 'cancelled' && !($actor?->hasAnyRole(['admin', 'manager']) ?? false)) {
            return response()->json([
                'message' => 'Only admin or manager can cancel orders.',
            ], 403);
        }

        if ($nextStatus === 'cancelled' && $previousStatus !== 'pending') {
            return response()->json([
                'message' => 'Only pending orders can be cancelled.',
            ], 422);
        }

        if (in_array($nextStatus, ['refund_requested', 'refunded'], true)) {
            $isFinanceApprover = $actor?->hasAnyRole(['admin', 'manager', 'accountant']) ?? false;
            if (! $isFinanceApprover) {
                $approval = ApprovalRequest::query()
                    ->whereKey($approvalRequestId)
                    ->where('order_id', $order->id)
                    ->where('request_type', 'refund')
                    ->where('status', 'approved')
                    ->first();

                if (! $approval) {
                    return response()->json([
                        'message' => 'Manager approval is required for refund actions.',
                    ], 422);
                }
            }
        }

        $order->update(['status' => $nextStatus]);

        if (
            in_array($nextStatus, ['cancelled', 'refunded', 'returned'], true)
            && ! in_array($previousStatus, ['cancelled', 'refunded', 'returned'], true)
        ) {
            $this->restockOrderItemsAction->execute($order);
        }

        if ($nextStatus === 'refund_requested') {
            $order->update(['refund_requested_at' => now()]);
        }
        if ($nextStatus === 'refunded') {
            $order->update(['refunded_at' => now()]);
        }
        if ($nextStatus === 'return_requested') {
            $order->update(['return_requested_at' => now()]);
        }
        if ($nextStatus === 'returned') {
            $order->update(['returned_at' => now()]);
        }
        if ($nextStatus === 'delivered') {
            $order->update(['delivered_at' => now()]);
        }
        if ($nextStatus === 'cancelled') {
            $order->update([
                'cancelled_at' => now(),
                'cancel_reason' => $request->input('cancel_reason'),
            ]);
        }

        $this->auditLogger->log(
            event: 'order.status_updated',
            auditable: $order,
            old: ['status' => $previousStatus],
            new: ['status' => $nextStatus],
            meta: ['approval_request_id' => $approvalRequestId],
            actor: $actor,
        );

        event(new \App\Events\OrderStatusUpdated($order));

        return response()->json([
            'message' => 'Order status updated.',
            'data' => new OrderResource($order->load($this->orderRelations())),
        ]);
    }

    public function updateDeliveryLocation(Request $request, Order $order): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor && $actor->hasAnyRole(['admin', 'manager', 'delivery']), 403);
        $this->authorizeStaffOrderAccess($actor, $order);

        $validated = $request->validate([
            'delivery_lat' => ['required', 'numeric', 'between:-90,90'],
            'delivery_lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $order->update([
            'delivery_lat' => (float) $validated['delivery_lat'],
            'delivery_lng' => (float) $validated['delivery_lng'],
            'delivery_updated_at' => now(),
        ]);

        event(new \App\Events\OrderStatusUpdated($order));

        return response()->json([
            'message' => 'Delivery location updated.',
            'data' => new OrderResource($order->load($this->orderRelations())),
        ]);
    }

    public function uploadShipmentProof(Request $request, Order $order): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor && $actor->hasAnyRole(['admin', 'manager', 'delivery']), 403);
        $this->authorizeStaffOrderAccess($actor, $order);

        $validated = $request->validate([
            'delivery_proof' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
            'delivery_proofs' => ['nullable', 'array', 'max:50'],
            'delivery_proofs.*' => ['image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
        ]);

        $files = [];
        if ($request->hasFile('delivery_proofs')) {
            $uploaded = $request->file('delivery_proofs');
            if (is_array($uploaded)) {
                $files = array_values($uploaded);
            } elseif ($uploaded) {
                $files = [$uploaded];
            }
        } elseif (!empty($validated['delivery_proof'])) {
            $files = [$validated['delivery_proof']];
        }

        if (empty($files)) {
            return response()->json([
                'message' => 'At least one delivery proof image is required.',
            ], 422);
        }

        $paths = [];
        foreach ($files as $file) {
            $paths[] = $file->store('delivery-proofs', 'public');
        }

        $primaryPath = $paths[0] ?? null;
        if ($this->hasDeliveryProofsTable()) {
            $existingCount = (int) $order->deliveryProofs()->count();
            $proofRows = [];
            foreach ($paths as $index => $path) {
                $proofRows[] = [
                    'path' => $path,
                    'sort_order' => $existingCount + $index,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (!empty($proofRows)) {
                $order->deliveryProofs()->insert($proofRows);
            }
        }

        $order->update([
            'delivery_proof_path' => $primaryPath ?: $order->delivery_proof_path,
            'status' => 'shipped',
            'shipped_at' => now(),
        ]);

        event(new \App\Events\OrderStatusUpdated($order));

        return response()->json([
            'message' => 'Delivery proof uploaded. Order marked as shipped.',
            'data' => new OrderResource($order->load($this->orderRelations())),
        ]);
    }

    private function orderRelations(): array
    {
        $relations = ['user.roles', 'customer', 'shop', 'items.product', 'items.variant', 'discounts', 'taxes', 'payments'];

        if ($this->hasDeliveryProofsTable()) {
            $relations[] = 'deliveryProofs';
        }

        return $relations;
    }

    private function hasDeliveryProofsTable(): bool
    {
        static $hasTable = null;
        if ($hasTable !== null) {
            return $hasTable;
        }

        try {
            $hasTable = Schema::hasTable('order_delivery_proofs');
        } catch (\Throwable) {
            $hasTable = false;
        }

        return $hasTable;
    }

    private function authorizeStaffOrderAccess($user, Order $order): void
    {
        if (!$user || !method_exists($user, 'hasRole')) {
            abort(403);
        }

        if ($user->hasRole('admin')) {
            return;
        }

        if ($user->hasRole('manager')) {
            abort_if((int) $order->shop_id !== (int) $user->shop_id, 403);
        }
    }
}
