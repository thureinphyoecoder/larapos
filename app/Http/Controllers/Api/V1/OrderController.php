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
            ->with(['user.roles', 'shop', 'items.product', 'items.variant'])
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
            'data' => new OrderResource($order->load(['user.roles', 'shop', 'items.product', 'items.variant'])),
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $user = $request->user();

        $order = $request->filled('items')
            ? $this->createOrderFromItemsAction->execute(
                user: $user,
                items: $request->input('items', []),
                phone: $request->string('phone')->toString(),
                address: $request->string('address')->toString(),
                forcedShopId: $request->integer('shop_id') ?: null,
                paymentSlip: $request->file('payment_slip'),
            )
            : $this->createOrderFromCartAction->execute(
                user: $user,
                phone: $request->string('phone')->toString(),
                address: $request->string('address')->toString(),
                shopId: $request->integer('shop_id') ?: null,
                paymentSlip: $request->file('payment_slip'),
            );

        event(new \App\Events\NewOrderPlaced($order));

        return response()->json([
            'message' => 'Order created successfully.',
            'data' => new OrderResource($order),
        ], 201);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $actor = $request->user();
        $previousStatus = $order->status;
        $nextStatus = $request->string('status')->toString();
        $approvalRequestId = $request->integer('approval_request_id') ?: null;

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
            'data' => new OrderResource($order->load(['user.roles', 'shop', 'items.product', 'items.variant'])),
        ]);
    }
}
