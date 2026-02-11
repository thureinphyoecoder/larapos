import React, { useEffect, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Swal from "sweetalert2";

export default function Show({ order }) {
    const [liveOrder, setLiveOrder] = useState(order);

    useEffect(() => {
        if (window.Echo && order?.id) {
            const channel = `order.${order.id}`;
            window.Echo.channel(channel).listen(".OrderStatusUpdated", (e) => {
                setLiveOrder((prev) => ({
                    ...prev,
                    status: e.status,
                    delivery_lat: e.delivery_lat,
                    delivery_lng: e.delivery_lng,
                    delivery_updated_at: e.delivery_updated_at,
                }));
            });
            return () => {
                window.Echo.leaveChannel(channel);
            };
        }
    }, [order?.id]);

    const printReceipt = () => {
        window.print(); // Browser ရဲ့ print function ကို ခေါ်လိုက်တာပါ
    };

    const cancelOrder = () => {
        Swal.fire({
            title: "Cancel order?",
            text: "Only pending orders can be cancelled.",
            icon: "warning",
            input: "textarea",
            inputLabel: "Cancellation reason",
            inputPlaceholder: "Please tell us why you want to cancel this order...",
            inputValidator: (value) => {
                if (!value || value.trim().length < 5) {
                    return "Please enter at least 5 characters.";
                }
                return null;
            },
            showCancelButton: true,
            confirmButtonText: "Yes, cancel order",
            cancelButtonText: "Back",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.patch(route("orders.cancel", order.id), { cancel_reason: result.value || "" }, {
                onSuccess: () => Swal.fire("Cancelled", "Order cancelled.", "success"),
            });
        });
    };

    const requestRefund = () => {
        Swal.fire({
            title: "Request refund?",
            text: "Admin will review and process your refund.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Request",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.post(route("orders.refund", order.id), {}, {
                onSuccess: () => Swal.fire("Requested", "Refund requested.", "success"),
            });
        });
    };

    const requestReturn = () => {
        Swal.fire({
            title: "Request return?",
            text: "Please provide a reason for return.",
            input: "textarea",
            inputPlaceholder: "Reason...",
            showCancelButton: true,
            confirmButtonText: "Request",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.post(
                route("orders.return", order.id),
                { return_reason: result.value || "" },
                {
                    onSuccess: () =>
                        Swal.fire("Requested", "Return requested.", "success"),
                },
            );
        });
    };

    const status = (liveOrder?.status || order.status || "pending").toString().toLowerCase();

    return (
        <AuthenticatedLayout>
            <div className="py-6 bg-gray-50 min-h-screen print:bg-white print:py-0">
                <Head title={`Order #${order.id} - Order`} />

                <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border print:shadow-none print:border-none">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-orange-600 mb-1">
                            Order #{order.id}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Track delivery, status, and actions here.
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase">
                            {status}
                        </span>
                    </div>
                </div>

                {/* ပို့ဆောင်မည့် အချက်အလက် */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border">
                        <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">
                            Delivery Info
                        </h4>
                        <p className="text-gray-800 font-medium">
                            ဖုန်း: {order.phone || "N/A"}
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {order.address || "N/A"}
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border">
                        <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">
                            Order Summary
                        </h4>
                        <p className="text-sm text-gray-600">
                            Items: {order.items.length}
                        </p>
                        <p className="text-sm text-gray-600">
                            Total: {Number(order.total_amount).toLocaleString()} Ks
                        </p>
                    </div>
                </div>

                {status === "cancelled" && liveOrder?.cancel_reason && (
                    <div className="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-4">
                        <h4 className="font-bold text-rose-700 mb-2 uppercase text-xs tracking-wider">Cancel Reason</h4>
                        <p className="text-sm text-rose-800">{liveOrder.cancel_reason}</p>
                    </div>
                )}

                {/* Items preview */}
                <div className="mb-8">
                    <h4 className="font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider">
                        Items
                    </h4>
                    <div className="space-y-2">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center bg-white border rounded-xl p-3"
                            >
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {item.product?.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        x {item.quantity}
                                    </p>
                                </div>
                                <div className="text-sm font-bold text-gray-800">
                                    {(item.price * item.quantity).toLocaleString()} Ks
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Link
                        href={route("orders.receipt", order.id)}
                        className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                    >
                        View Receipt
                    </Link>
                </div>

                {/* Delivery / Tracking UI */}
                {(status === "shipped" || status === "delivered") && (
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h4 className="font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider">
                            Delivery Route
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 bg-slate-50 rounded-xl border p-4">
                                {liveOrder?.delivery_lat && liveOrder?.delivery_lng ? (
                                    <iframe
                                        title="delivery-map"
                                        className="w-full h-56 rounded border"
                                        src={`https://www.openstreetmap.org/?mlat=${liveOrder.delivery_lat}&mlon=${liveOrder.delivery_lng}#map=14/${liveOrder.delivery_lat}/${liveOrder.delivery_lng}`}
                                    />
                                ) : (
                                    <div className="h-56 flex items-center justify-center text-slate-400">
                                        Driver location not available yet
                                    </div>
                                )}
                            </div>
                            <div className="bg-white rounded-xl border p-4">
                                <p className="text-xs text-slate-400 uppercase tracking-widest">
                                    Status
                                </p>
                                <p className="mt-2 text-lg font-bold text-slate-800">
                                    {status === "shipped" ? "On the way" : "Delivered"}
                                </p>
                                <div className="mt-4 space-y-2 text-sm text-slate-600">
                                    <div className="flex justify-between">
                                        <span>Order Confirmed</span>
                                        <span>✓</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shipped</span>
                                        <span>{status === "shipped" || status === "delivered" ? "✓" : "•"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Delivered</span>
                                        <span>{status === "delivered" ? "✓" : "•"}</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-xs text-slate-400">
                                    Updated:{" "}
                                    {liveOrder?.delivery_updated_at
                                        ? new Date(liveOrder.delivery_updated_at).toLocaleString()
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="mt-10 print:hidden space-y-4">
                    <div className="flex gap-4">
                        {status === "delivered" && (
                            <button
                                onClick={printReceipt}
                                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition flex items-center justify-center gap-2"
                            >
                                <span>🖨️</span> ပြေစာထုတ်မည် (Print)
                            </button>
                        )}
                        <Link
                            href={route("home")}
                            className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition text-center"
                        >
                            စျေးဝယ်ထွက်ရန်
                        </Link>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {liveOrder?.status === "pending" && (
                            <button
                                onClick={cancelOrder}
                                className="px-4 py-2 rounded-full border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
                            >
                                Cancel Order
                            </button>
                        )}
                        {["confirmed", "shipped"].includes(
                            liveOrder?.status || "",
                        ) && order.payment_slip && (
                            <button
                                onClick={requestRefund}
                                className="px-4 py-2 rounded-full border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-50"
                            >
                                Request Refund
                            </button>
                        )}
                        {liveOrder?.status === "delivered" && (
                            <button
                                onClick={requestReturn}
                                className="px-4 py-2 rounded-full border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-50"
                            >
                                Request Return
                            </button>
                        )}
                    </div>
                </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
