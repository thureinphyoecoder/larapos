<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{


    public function index()
    {
        $cartItems = CartItem::with(['product', 'variant'])
            ->where('user_id', Auth::id())
            ->get();

        return inertia('Cart/Index', [
            'cartItems' => $cartItems
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::check()) {
            return back()->withErrors(['message' => 'ကျေးဇူးပြု၍ အရင် Login ဝင်ပေးပါ']);
        }

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'required|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
            'redirect_to' => 'nullable|string'
        ]);

        // 🎯 ခြင်းတောင်းထဲမှာ ဒီပစ္စည်း ရှိ၊ မရှိ အရင်စစ်မယ်
        $cartItem = CartItem::where('user_id', Auth::id())
            ->where('variant_id', $request->variant_id)
            ->first();

        if ($cartItem) {
            // ရှိပြီးသားဆိုရင် လက်ရှိ quantity ကို ယူပြီး ပေါင်းမယ်
            $cartItem->update([
                'quantity' => $cartItem->quantity + $request->quantity
            ]);
        } else {
            // မရှိသေးရင် အသစ်ဆောက်မယ်
            CartItem::create([
                'user_id' => Auth::id(),
                'product_id' => $request->product_id,
                'variant_id' => $request->variant_id,
                'quantity' => $request->quantity
            ]);
        }

        $redirectTo = $request->input('redirect_to');
        if (is_string($redirectTo) && $redirectTo !== '') {
            $targetPath = str_starts_with($redirectTo, '/')
                ? $redirectTo
                : parse_url($redirectTo, PHP_URL_PATH);

            if (is_string($targetPath) && str_starts_with($targetPath, '/')) {
                return redirect($targetPath)->with('success', 'ခြင်းတောင်းထဲ ထည့်ပြီးပါပြီ');
            }
        }

        return back()->with('success', 'ခြင်းတောင်းထဲ ထည့်ပြီးပါပြီ');
    }

    public function destroy($id)
    {
        // 🎯 ဖျက်မယ့်သူဟာ ဒီပစ္စည်းပိုင်ရှင် ဟုတ်မဟုတ်ပါ တစ်ခါတည်း စစ်မယ်
        $cartItem = CartItem::where('user_id', Auth::id())->where('id', $id)->first();

        if ($cartItem) {
            $cartItem->delete();
            return back()->with('success', 'ခြင်းတောင်းထဲမှ ဖယ်ရှားပြီးပါပြီ');
        }

        return back()->withErrors(['message' => 'ဖျက်ခွင့်မရှိပါ သို့မဟုတ် ပစ္စည်းမရှိတော့ပါ']);
    }
}
