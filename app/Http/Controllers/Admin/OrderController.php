<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Orders\RefreshProductStockAction;
use App\Actions\Orders\RestockOrderItemsAction;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function __construct(
        private readonly RefreshProductStockAction $refreshProductStockAction,
        private readonly RestockOrderItemsAction $restockOrderItemsAction,
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $ordersQuery = Order::with(['user', 'items.product'])->latest();

        if ($user && method_exists($user, 'hasRole') && $user->hasRole('manager')) {
            $ordersQuery->where('shop_id', (int) $user->shop_id);
        }

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $ordersQuery->paginate(10)
        ]);
    }

    // Customer Orders List
    public function customerIndex()
    {
        return Inertia::render('Orders/Index', [
            'orders' => Order::with(['items.product'])
                ->where('user_id', Auth::id())
                ->latest()
                ->paginate(10),
        ]);
    }


    public function show(Order $order)
    {
        // Admin/Staff ကတော့ အားလုံးကြည့်လို့ရ၊ Customer က သူ့ Order ပဲကြည့်နိုင်
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        $isStaff = $user && method_exists($user, 'hasAnyRole')
            ? $user->hasAnyRole(['admin', 'manager', 'sales', 'delivery', 'cashier', 'accountant', 'technician'])
            : false;

        if (!$isStaff && $order->user_id !== Auth::id()) {
            abort(403);
        }
        if ($isStaff) {
            $this->authorizeStaffOrderAccess($user, $order);
        }

        return Inertia::render('Admin/Orders/Show', [
            'order' => $order->load(['user', 'items.product', 'items.variant'])
        ]);
    }

    // Customer Receipt View
    public function customerShow(Order $order)
    {
        // Customer က သူ့ Order ပဲကြည့်နိုင်
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('Orders/Show', [
            'order' => $order->load(['user', 'items.product', 'items.variant'])
        ]);
    }

    public function customerReceipt(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('Orders/Receipt', [
            'order' => $order->load(['user', 'items.product', 'items.variant'])
        ]);
    }


    public function edit(Order $order)
    {
        // ပိုင်ရှင် ဟုတ်မဟုတ် စစ်မယ်
        if ($order->user_id !== Auth::id() || $order->status !== 'pending') {
            return back()->with('error', 'ဒီအော်ဒါကို ပြင်ဆင်ခွင့်မရှိပါဘူးဗျာ။');
        }
        return Inertia::render('Orders/Edit', ['order' => $order]);
    }

    public function update(Request $request, Order $order)
    {
        $request->validate([
            'phone' => 'required',
            'address' => 'required',
        ]);

        // Profile ရော Order ထဲက လိပ်စာပါ Update လုပ်မယ်
        $order->update([
            'phone' => $request->phone, // orders table မှာ phone/address သိမ်းထားရင်
            'address' => $request->address,
        ]);

        return redirect()->route('orders.show', $order->id)->with('success', 'အချက်အလက် ပြင်ဆင်ပြီးပါပြီ။');
    }

    public function confirm(Request $request)
    {
        try {
            $request->validate([
                'phone' => ['required', 'regex:/^(09|06|\+959)[0-9]{7,9}$/'],
                'address' => 'required|min:10|max:500',
                'payment_slip' => 'required|image|mimes:jpeg,png,jpg|max:2048',
                'total_amount' => 'required|numeric|min:100',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // 🎯 Loop မပတ်အောင် မူလ checkout page ကိုပဲ ပြန်လွှတ်လိုက်မယ်
            return redirect()->route('checkout.index')->withErrors($e->errors());
        }

        // ပုံသိမ်းခြင်း
        $path = $request->file('payment_slip')->store('slips', 'public');

        $request->session()->put('checkout_confirm', [
            'phone' => $request->phone,
            'address' => $request->address,
            'payment_slip' => $path,
            'total_amount' => $request->total_amount,
        ]);

        return redirect()->route('checkout.confirm.page');
    }

    public function confirmPage(Request $request)
    {
        $formData = $request->session()->get('checkout_confirm');
        if (!is_array($formData)) {
            return redirect()->route('checkout.index');
        }

        return Inertia::render('Checkout/Confirm', [
            'formData' => $formData,
            'cartItems' => \App\Models\CartItem::with('variant.product')
                ->where('user_id', Auth::id())
                ->get(),
            'total_amount' => $formData['total_amount'] ?? 0,
        ]);
    }

    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // ၁။ ခြင်းတောင်းထဲမှာ ပစ္စည်း တကယ်ရှိလား အရင်စစ် (Early Return)
        $cartItems = CartItem::with(['variant.product'])->where('user_id', $user->id)->get();
        if ($cartItems->isEmpty()) {
            throw ValidationException::withMessages([
                'system_error' => 'ခြင်းတောင်းထဲမှာ ပစ္စည်းမရှိပါဘူးဗျာ။',
            ]);
        }

        $shopIds = $cartItems
            ->map(fn ($item) => $item->variant?->product?->shop_id)
            ->filter()
            ->unique()
            ->values();
        if ($shopIds->count() !== 1) {
            throw ValidationException::withMessages([
                'system_error' => 'Please checkout items from one shop at a time.',
            ]);
        }

        $request->validate([
            'phone' => 'required|min:9|max:15',
            'address' => 'required|string|min:10',
            'payment_slip' => 'required|string|max:255|starts_with:slips/',
        ]);

        if (!Storage::disk('public')->exists($request->payment_slip)) {
            throw ValidationException::withMessages([
                'payment_slip' => 'Invalid payment slip reference.',
            ]);
        }

        $calculatedTotal = $cartItems->sum(fn($item) => (float) $item->variant->price * (int) $item->quantity);

        DB::beginTransaction();
        try {
            $variantIds = $cartItems->pluck('variant_id')->unique()->values();
            $lockedVariants = ProductVariant::whereIn('id', $variantIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // Profile Update
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'phone_number' => $request->phone,
                    'address_line_1' => $request->address,
                    'city' => $request->city ?? 'Unknown',
                    'state' => $request->state ?? 'Unknown',
                ]
            );

            // Order Table ထဲ သိမ်း
            $customer = Customer::query()->firstOrCreate(
                ['phone' => $request->phone, 'name' => $user->name ?: 'POS Customer'],
                ['address' => $request->address, 'created_by' => $user->id],
            );

            $order = Order::create([
                'user_id' => $user->id,
                'customer_id' => $customer->id,
                'shop_id' => (int) $shopIds->first(),
                'total_amount' => $calculatedTotal, // 🎯 Backend calculated value
                'payment_slip' => $request->payment_slip,
                'status' => 'pending',
                'phone' => $request->phone,
                'address' => $request->address,
            ]);

            // Order Items ထဲ သိမ်း
            $affectedProductIds = [];
            foreach ($cartItems as $item) {
                $variant = $lockedVariants->get($item->variant_id);
                if (!$variant || !$variant->is_active) {
                    throw ValidationException::withMessages([
                        'system_error' => 'One or more variants are no longer available.',
                    ]);
                }
                if ((int) $variant->stock_level < (int) $item->quantity) {
                    throw ValidationException::withMessages([
                        'system_error' => "Insufficient stock for {$variant->sku}.",
                    ]);
                }

                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->variant_id,
                    'qty' => (int) $item->quantity,
                    'unit_price' => $variant->price,
                    'quantity' => $item->quantity,
                    'price' => $variant->price,

                ]);

                $affected = ProductVariant::query()
                    ->whereKey((int) $variant->id)
                    ->where('stock_level', '>=', (int) $item->quantity)
                    ->decrement('stock_level', (int) $item->quantity);

                if ($affected !== 1) {
                    throw ValidationException::withMessages([
                        'system_error' => "Insufficient stock for {$variant->sku}.",
                    ]);
                }
                $affectedProductIds[] = (int) $item->product_id;
            }

            $this->refreshProductStockAction->execute($affectedProductIds);

            Payment::query()->create([
                'order_id' => $order->id,
                'event_type' => 'deposit',
                'amount' => $calculatedTotal,
                'status' => 'pending_verification',
                'note' => 'Checkout deposit from uploaded slip',
                'actor_id' => $user->id,
                'meta' => ['payment_slip' => $request->payment_slip],
            ]);

            // ခြင်းတောင်း ရှင်း
            CartItem::where('user_id', $user->id)->delete();

            DB::commit();
            $request->session()->forget('checkout_confirm');

            // Order save ကို မထိခိုက်စေဖို့ broadcast failure ကို swallow လုပ်မယ်
            try {
                event(new \App\Events\NewOrderPlaced($order));
            } catch (\Throwable $broadcastError) {
                Log::warning('NewOrderPlaced broadcast failed', [
                    'order_id' => $order->id,
                    'error' => $broadcastError->getMessage(),
                ]);
            }

            return redirect()
                ->route('orders.show', $order->id)
                ->with('success', 'Order တင်ခြင်း အောင်မြင်ပါတယ်ဗျာ!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order create failed', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'system_error' => 'Order create failed. Please try again.',
            ]);
        }
    }

    public function updateStatus(Request $request, Order $order)
    {
        $user = $request->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager']), 403);
        $this->authorizeStaffOrderAccess($user, $order);

        $request->validate([
            'status' => 'required|in:pending,confirmed,shipped,delivered,cancelled,refund_requested,refunded,return_requested,returned'
        ]);

        $previousStatus = $order->status;
        $nextStatus = $request->status;
        $order->update(['status' => $nextStatus]);

        if (
            in_array($nextStatus, ['cancelled', 'refunded', 'returned'], true)
            && !in_array($previousStatus, ['cancelled', 'refunded', 'returned'], true)
        ) {
            $this->restockOrderItems($order);
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

        event(new \App\Events\OrderStatusUpdated($order));

        return back()->with('success', 'Order Status ကို ပြောင်းလဲပြီးပါပြီ');
    }

    public function customerCancel(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->status !== 'pending') {
            return back()->withErrors(['status' => 'Only pending orders can be cancelled.']);
        }

        $order->update(['status' => 'cancelled']);
        $this->restockOrderItems($order);
        event(new \App\Events\OrderStatusUpdated($order));

        return back()->with('success', 'Order cancelled.');
    }

    public function requestRefund(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if (!$order->payment_slip) {
            return back()->withErrors(['slip' => 'Payment slip required for refund.']);
        }

        if (!in_array($order->status, ['confirmed', 'shipped'], true)) {
            return back()->withErrors(['status' => 'Refund not available for this status.']);
        }

        $order->update([
            'status' => 'refund_requested',
            'refund_requested_at' => now(),
        ]);

        event(new \App\Events\OrderStatusUpdated($order));

        return back()->with('success', 'Refund requested.');
    }

    public function requestReturn(Request $request, Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        if ($order->status !== 'delivered') {
            return back()->withErrors(['status' => 'Return available only after delivered.']);
        }

        if ($order->delivered_at) {
            $days = now()->diffInDays($order->delivered_at);
            if ($days > 7) {
                return back()->withErrors(['status' => 'Return window expired (7 days).']);
            }
        }

        $request->validate([
            'return_reason' => 'required|string|max:500',
        ]);

        $order->update([
            'status' => 'return_requested',
            'return_requested_at' => now(),
            'return_reason' => $request->return_reason,
        ]);

        event(new \App\Events\OrderStatusUpdated($order));

        return back()->with('success', 'Return requested.');
    }

    public function updateLocation(Request $request, Order $order)
    {
        $this->authorizeStaffOrderAccess($request->user(), $order);

        $request->validate([
            'delivery_lat' => 'required|numeric|between:-90,90',
            'delivery_lng' => 'required|numeric|between:-180,180',
        ]);

        $order->update([
            'delivery_lat' => $request->delivery_lat,
            'delivery_lng' => $request->delivery_lng,
            'delivery_updated_at' => now(),
        ]);

        event(new \App\Events\OrderStatusUpdated($order));

        return back()->with('success', 'Delivery location updated.');
    }

    public function confirmShipment(Request $request, Order $order)
    {
        $this->authorizeStaffOrderAccess($request->user(), $order);

        $request->validate([
            'delivery_proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if (in_array($order->status, ['cancelled', 'delivered'], true)) {
            return back()->withErrors([
                'status' => 'Cannot mark shipment for cancelled/delivered orders.',
            ]);
        }

        $path = $request->file('delivery_proof')->store('delivery-proofs', 'public');

        $order->update([
            'delivery_proof_path' => $path,
            'status' => 'shipped',
            'shipped_at' => now(),
        ]);

        event(new \App\Events\OrderStatusUpdated($order));

        return back()->with('success', 'Delivery proof uploaded. Order marked as shipped.');
    }

    public function verifySlip(Order $order)
    {
        $user = request()->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'manager', 'accountant']), 403);
        $this->authorizeStaffOrderAccess($user, $order);

        if (!$order->payment_slip) {
            return back()->withErrors(['slip' => 'Payment slip not found.']);
        }

        \App\Jobs\VerifyPaymentSlip::dispatchSync($order->id);

        return back()->with('success', 'Slip verification completed.');
    }

    private function restockOrderItems(Order $order): void
    {
        $this->restockOrderItemsAction->execute($order);
    }

    private function authorizeStaffOrderAccess($user, Order $order): void
    {
        if (!$user || !method_exists($user, 'hasRole')) {
            return;
        }

        if ($user->hasRole('admin')) {
            return;
        }

        if ($user->hasRole('manager')) {
            abort_if((int) $order->shop_id !== (int) $user->shop_id, 403);
        }
    }
}
