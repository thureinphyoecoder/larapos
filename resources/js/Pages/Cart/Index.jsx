import { Link, router } from "@inertiajs/react"; // usePage မလိုရင် ဖယ်ထားလို့ရပါတယ်
import Swal from "sweetalert2";

export default function Index({ cartItems = [] }) {
    const isCartEmpty = cartItems.length === 0;

    // စုစုပေါင်း ကျသင့်ငွေ တွက်ချက်ခြင်း
    const totalPrice = cartItems.reduce((sum, item) => {
        return sum + item.variant.price * item.quantity;
    }, 0);

    const removeFromCart = (id) => {
        Swal.fire({
            title: "သေချာပါသလား?",
            text: "ခြင်းတောင်းထဲမှ ဤပစ္စည်းကို ဖယ်ရှားလိုပါသလား?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#f97316",
            cancelButtonText: "မလုပ်တော့ပါ",
            confirmButtonText: "ဖယ်ရှားမည်",
        }).then((result) => {
            if (result.isConfirmed) {
                // Controller မှာ destroy function ရှိဖို့ လိုပါတယ်
                router.delete(`/cart/${id}`, {
                    onSuccess: () =>
                        Swal.fire("ဖယ်ရှားပြီးပါပြီ", "", "success"),
                });
            }
        });
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <header className="bg-white border-b p-4 mb-6">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Link
                        href="/"
                        className="text-2xl font-bold text-orange-500"
                    >
                        LaraPee | ခြင်းတောင်း
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4">
                <h2 className="text-xl font-bold mb-4">
                    သင်ရွေးချယ်ထားသော ပစ္စည်းများ
                </h2>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        {cartItems.length > 0 ? (
                            cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white p-4 rounded shadow-sm flex gap-4 items-center border"
                                >
                                    {/* Brand Logo or Placeholder */}
                                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-400 text-[10px] text-center p-1">
                                        {item.product.brand?.name || "No Brand"}
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-800">
                                            {item.product.name}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            Variant: {item.variant.sku}
                                        </p>
                                        <p className="text-orange-600 font-bold mt-1">
                                            Ks{" "}
                                            {item.variant.price.toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-sm font-bold bg-gray-50 px-3 py-1 rounded border">
                                            x {item.quantity}
                                        </div>
                                        <button
                                            onClick={() =>
                                                removeFromCart(item.id)
                                            }
                                            className="text-gray-400 hover:text-red-500 transition"
                                            title="ဖယ်ရှားမည်"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-12 text-center rounded shadow-sm border border-dashed">
                                <p className="text-gray-500 mb-4">
                                    ခြင်းတောင်းထဲတွင် ပစ္စည်းမရှိသေးပါ
                                </p>
                                <Link
                                    href="/"
                                    className="bg-orange-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition inline-block"
                                >
                                    ဈေးဝယ်ထွက်မယ်
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Summary Card */}
                    <div className="md:w-80">
                        <div className="bg-white p-6 rounded shadow-sm sticky top-24 border">
                            <h3 className="font-bold border-b pb-2 mb-4">
                                စုစုပေါင်းစာရင်း
                            </h3>
                            <div className="flex justify-between mb-6">
                                <span className="text-gray-600">
                                    စုစုပေါင်း ကျသင့်ငွေ
                                </span>
                                <span className="font-bold text-xl text-orange-600">
                                    Ks {totalPrice.toLocaleString()}
                                </span>
                            </div>

                            <Link
                                href={
                                    isCartEmpty ? "#" : route("checkout.index")
                                }
                                as="button"
                                disabled={isCartEmpty}
                                className={`w-full py-3 rounded-xl font-bold text-white transition shadow-md ${
                                    isCartEmpty
                                        ? "bg-gray-300 cursor-not-allowed shadow-none"
                                        : "bg-orange-600 hover:bg-orange-700 active:scale-95"
                                }`}
                            >
                                {isCartEmpty
                                    ? "ပစ္စည်းအရင်ရွေးပါ"
                                    : "ငွေချေမည် (Checkout)"}
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
