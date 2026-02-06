import React from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Receipt({ order }) {
    const printReceipt = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout>
            <div className="py-6 bg-gray-50 min-h-screen print:bg-white print:py-0">
                <Head title={`Order #${order.id} - Receipt`} />

                <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border print:shadow-none print:border-none">
                <div className="flex justify-between items-start border-b pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-orange-600 mb-1">
                            MY SHOP
                        </h1>
                        <p className="text-gray-500 text-sm">
                            ဝယ်ယူအားပေးမှုကို ကျေးဇူးတင်ပါသည်
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold text-gray-800">
                            ပြေစာ (RECEIPT)
                        </h2>
                        <p className="text-sm text-gray-500">
                            အော်ဒါနံပါတ်: #{order.id}
                        </p>
                        <p className="text-sm text-gray-500">
                            ရက်စွဲ: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">
                            ပို့ဆောင်မည့်သူ
                        </h4>
                        <p className="text-gray-800 font-medium">
                            ဖုန်း: {order.phone || "N/A"}
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {order.address || "N/A"}
                        </p>
                    </div>
                    <div className="text-right">
                        <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">
                            အခြေအနေ
                        </h4>
                        <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase">
                            {order.status}
                        </span>
                    </div>
                </div>

                <div className="mb-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-100 text-gray-400 text-xs uppercase tracking-tighter">
                                <th className="py-3 font-bold">ဝယ်ယူသည့် ပစ္စည်း</th>
                                <th className="py-3 text-center font-bold">အရေအတွက်</th>
                                <th className="py-3 text-right font-bold">ဈေးနှုန်း</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {order.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-4">
                                        <div className="font-bold text-gray-800">
                                            {item.product?.name}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Variant: {item.product_variant_id}
                                        </div>
                                    </td>
                                    <td className="py-4 text-center text-gray-600">
                                        {item.quantity}
                                    </td>
                                    <td className="py-4 text-right font-semibold text-gray-800">
                                        {(item.price * item.quantity).toLocaleString()} Ks
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t-2 border-gray-100 pt-6 flex justify-end">
                    <div className="w-full md:w-64 space-y-3">
                        <div className="flex justify-between text-gray-500">
                            <span>စုစုပေါင်း (Total)</span>
                            <span>{Number(order.total_amount).toLocaleString()} Ks</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-orange-600 border-t pt-3">
                            <span>ကျသင့်ငွေ</span>
                            <span>{Number(order.total_amount).toLocaleString()} Ks</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex gap-4 print:hidden">
                    <button
                        onClick={printReceipt}
                        className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition flex items-center justify-center gap-2"
                    >
                        <span>🖨️</span> ပြေစာထုတ်မည် (Print)
                    </button>
                    <Link
                        href={route("orders.show", order.id)}
                        className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition text-center"
                    >
                        Back to Order
                    </Link>
                </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
