import React from "react";
import { router, Head, useForm } from "@inertiajs/react";

export default function Confirm({ formData, cartItems }) {
    const { data, post, processing } = useForm({
        phone: formData.phone,
        address: formData.address,
        payment_slip: formData.payment_slip, // ဒါက storage path ဖြစ်နေပါလိမ့်မယ်
        total_amount: formData.total_amount,
    });

    const handleEdit = () => {
        // 🎯 Checkout Page ကို ဒေတာတွေ ပြန်ပို့ပေးလိုက်မယ်
        router.visit(route("checkout.index"), {
            method: "get",
            data: {
                phone: formData.phone,
                address: formData.address,
                // 💡 သတိပြုရန် - လုံခြုံရေးအရ ပုံဖိုင် (File Input) ကိုတော့ browser က automatic ပြန်ဖြည့်ပေးလို့ မရပါဘူး
            },
        });
    };

    const submitOrder = (e) => {
        e.preventDefault();
        // 🎯 orders.store ဆီကို data တွေ အမှန်အတိုင်း ပို့မယ်
        post(route("orders.store"), {
            data: {
                phone: formData.phone,
                address: formData.address,
                payment_slip: formData.payment_slip,
                total_amount: formData.total_amount,
            },
            onSuccess: () => {
                console.log("Success! Receipt should show now.");
            },
            onError: (errors) => {
                // 🎯 ဒီနေရာမှာ ဘာ Error တက်လဲဆိုတာ Inspect > Console မှာ ကြည့်လို့ရပါပြီ
                console.log("Validation Errors:", errors);
            },
        });
    };

    return (
        <div className="py-12 bg-gray-50 min-h-screen">
            <Head title="Order Confirmation" />
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                    <span className="mr-2">📝</span> အော်ဒါကို အတည်ပြုပေးပါ
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* ပို့ဆောင်မည့်လိပ်စာ အကျဉ်းချုပ် */}
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                            📍 ပို့ဆောင်မည့် လိပ်စာ
                        </h4>
                        <div className="text-gray-700 space-y-1">
                            <p>
                                <span className="font-medium">ဖုန်း:</span>{" "}
                                {formData.phone}
                            </p>
                            <p>
                                <span className="font-medium">လိပ်စာ:</span>{" "}
                                {formData.address}
                            </p>
                        </div>
                    </div>
                    {/* ငွေလွှဲဖြတ်ပိုင်း */}
                    <div className="border border-dashed border-gray-300 p-5 rounded-xl text-center bg-gray-50">
                        <h4 className="font-bold mb-3 text-gray-700 flex items-center justify-center">
                            🖼️ ငွေလွှဲဖြတ်ပိုင်း (Slip)
                        </h4>
                        <img
                            src={`/storage/${formData.payment_slip}`}
                            className="h-40 mx-auto rounded-lg shadow-md border-2 border-white"
                            alt="Slip"
                        />
                    </div>
                </div>

                {/* ဝယ်ထားတဲ့ ပစ္စည်းစာရင်း Review */}
                <div className="overflow-hidden rounded-xl border border-gray-200 mb-8">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 text-sm">
                                <th className="p-4 text-left font-bold">
                                    ပစ္စည်းအမည်
                                </th>
                                <th className="p-4 text-center font-bold">
                                    အရေအတွက်
                                </th>
                                <th className="p-4 text-right font-bold">
                                    ဈေးနှုန်း
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cartItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-700 font-medium">
                                        {item.variant.product.name}
                                    </td>
                                    <td className="p-4 text-center text-gray-600">
                                        {item.quantity}
                                    </td>
                                    <td className="p-4 text-right font-semibold text-gray-800">
                                        {(
                                            item.variant.price * item.quantity
                                        ).toLocaleString()}{" "}
                                        Ks
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* အောက်ခြေ စုစုပေါင်းနှင့် ခလုတ်များ */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-6 rounded-2xl text-white gap-6">
                    <div className="text-2xl font-bold text-orange-400">
                        စုစုပေါင်း: {formData.total_amount.toLocaleString()} Ks
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        {/* 🎯 ပြန်ပြင်မည့်ခလုတ် */}
                        <button
                            onClick={handleEdit}
                            disabled={processing}
                            className="flex-1 md:flex-none px-8 py-3 rounded-xl border border-gray-500 text-gray-300 font-bold hover:bg-gray-800 transition disabled:opacity-50"
                        >
                            ပြန်ပြင်မည်
                        </button>

                        {/* 🎯 အော်ဒါတင်မည့်ခလုတ် */}
                        <button
                            onClick={submitOrder}
                            disabled={processing}
                            className="flex-1 md:flex-none bg-orange-600 text-white px-10 py-3 rounded-xl hover:bg-orange-700 font-bold text-lg shadow-lg active:transform active:scale-95 transition disabled:bg-gray-600"
                        >
                            {processing ? "တင်နေပါသည်..." : "အော်ဒါတင်မည်"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
