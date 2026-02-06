<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\CartItem;
use Illuminate\Support\Facades\Auth;

class CheckoutController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $cartItems = CartItem::with(['product', 'variant'])
            ->where('user_id', $user->id)
            ->get();

        if ($cartItems->isEmpty()) {
            return redirect()->route('cart.index');
        }

        return Inertia::render('Checkout/Index', [
            'cartItems' => $cartItems,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone, // Register မှာ မဖြည့်ရသေးလို့ null ဖြစ်နေမယ်
                'address' => $user->address, // null ဖြစ်နေမယ်
            ]
        ]);
    }
}
