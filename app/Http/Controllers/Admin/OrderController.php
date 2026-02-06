<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // Transaction အတွက်
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Orders/Index', [
            'orders' => Order::with(['user', 'items.product'])->latest()->paginate(10)
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
            ? $user->hasAnyRole(['admin', 'manager', 'sales'])
            : false;

        if (!$isStaff && $order->user_id !== Auth::id()) {
            abort(403);
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

        return Inertia::render('Checkout/Confirm', [
            'formData' => [
                'phone' => $request->phone,
                'address' => $request->address,
                'payment_slip' => $path,
                'total_amount' => $request->total_amount,
            ],
            'cartItems' => \App\Models\CartItem::with('variant.product')
                ->where('user_id', Auth::id())
                ->get(),
            'total_amount' => $request->total_amount
        ]);
    }

    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // ၁။ ခြင်းတောင်းထဲမှာ ပစ္စည်း တကယ်ရှိလား အရင်စစ် (Early Return)
        $cartItems = CartItem::with('variant')->where('user_id', $user->id)->get();
        if ($cartItems->isEmpty()) {
            return back()->withErrors(['system_error' => 'ခြင်းတောင်းထဲမှာ ပစ္စည်းမရှိပါဘူးဗျာ။']);
        }

        $request->validate([
            'phone' => 'required|min:9|max:15',
            'address' => 'required|string|min:10',
            'payment_slip' => 'required|string',
        ]);

        $calculatedTotal = $cartItems->sum(fn($item) => $item->variant->price * $item->quantity);

        DB::beginTransaction();
        try {
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
            $order = Order::create([
                'user_id' => $user->id,
                'shop_id' => $user->shop_id ?? 1,
                'total_amount' => $calculatedTotal, // 🎯 Backend calculated value
                'payment_slip' => $request->payment_slip,
                'status' => 'pending',
                'phone' => $request->phone,
                'address' => $request->address,
            ]);

            // Order Items ထဲ သိမ်း
            foreach ($cartItems as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $item->quantity,
                    'price' => $item->variant->price,

                ]);

                // လိုအပ်ရင် ဒီမှာ stock နှုတ်နိုင်ပါတယ်
            }

            // ခြင်းတောင်း ရှင်း
            CartItem::where('user_id', $user->id)->delete();

            // Real-time Notification
            event(new \App\Events\NewOrderPlaced($order));

            DB::commit();
            return redirect()
                ->route('orders.show', $order->id)
                ->with('success', 'Order တင်ခြင်း အောင်မြင်ပါတယ်ဗျာ!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['system_error' => 'Error: ' . $e->getMessage()]);
        }
    }

    public function updateStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,shipped,delivered,cancelled,refund_requested,refunded,return_requested,returned'
        ]);

        $order->update(['status' => $request->status]);

        if ($request->status === 'refund_requested') {
            $order->update(['refund_requested_at' => now()]);
        }
        if ($request->status === 'refunded') {
            $order->update(['refunded_at' => now()]);
        }
        if ($request->status === 'return_requested') {
            $order->update(['return_requested_at' => now()]);
        }
        if ($request->status === 'returned') {
            $order->update(['returned_at' => now()]);
        }
        if ($request->status === 'delivered') {
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

    public function verifySlip(Order $order)
    {
        if (!$order->payment_slip) {
            return back()->withErrors(['slip' => 'Payment slip not found.']);
        }

        \App\Jobs\VerifyPaymentSlip::dispatchSync($order->id);

        return back()->with('success', 'Slip verification completed.');
    }
}
