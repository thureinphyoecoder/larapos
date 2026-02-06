import AdminLayout from "@/Layouts/AdminLayout";
import { router, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";

export default function Show({ order }) {
    const { auth } = usePage().props;
    const role = auth?.role || "user";
    const [liveOrder, setLiveOrder] = useState(order);

    const items = order?.items || [];
    const customer = order?.user;
    const status = (liveOrder?.status || "pending").toString().toLowerCase();
    const [showSlip, setShowSlip] = useState(false);

    const updateStatus = (newStatus) => {
        Swal.fire({
            title: "Confirm",
            text: `Change order status to ${newStatus}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.patch(
                route("admin.orders.updateStatus", order.id),
                {
                    status: newStatus,
                },
                {
                    onSuccess: () => {
                        setLiveOrder((prev) => ({
                            ...prev,
                            status: newStatus,
                        }));
                        Swal.fire(
                            "Success",
                            `Order is now ${newStatus}`,
                            "success",
                        );
                    },
                },
            );
        });
    };

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

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Order #{order?.id} အသေးစိတ်
                    </h2>
                    <div className="space-x-2">
                        {/* Status ပြောင်းတဲ့ ခလုတ်များ */}
                        {status === "pending" && (
                            <button
                                onClick={() => updateStatus("confirmed")}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold"
                            >
                                Confirm Order
                            </button>
                        )}
                        {status === "confirmed" && (
                            <button
                                onClick={() => updateStatus("shipped")}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
                            >
                                Mark Shipped
                            </button>
                        )}
                        {status === "shipped" && (
                            <button
                                onClick={() => updateStatus("delivered")}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold"
                            >
                                Mark Delivered
                            </button>
                        )}
                        {status === "refund_requested" && (
                            <button
                                onClick={() => updateStatus("refunded")}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold"
                            >
                                Mark Refunded
                            </button>
                        )}
                        {status === "return_requested" && (
                            <button
                                onClick={() => updateStatus("returned")}
                                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold"
                            >
                                Mark Returned
                            </button>
                        )}
                        <button
                            onClick={() => updateStatus("cancelled")}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* ဘယ်ဘက်ခြမ်း: ပစ္စည်းစာရင်း */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="font-bold border-b pb-3 mb-4">
                                Ordered Items
                            </h3>
                            <table className="w-full">
                                <tbody>
                                    {items.length > 0 ? (
                                        items.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-4 font-medium">
                                                    {item.product?.name ||
                                                        "Unknown Product"}
                                                </td>
                                                <td className="py-4 text-gray-500">
                                                    x {item.quantity}
                                                </td>
                                                <td className="py-4 text-right font-bold">
                                                    {(
                                                        item.price *
                                                        item.quantity
                                                    ).toLocaleString()}{" "}
                                                    Ks
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="py-6 text-sm text-slate-400">
                                                No items found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ညာဘက်ခြမ်း: ငွေလွှဲဖြတ်ပိုင်း (Slip) နှင့် ဝယ်သူအချက်အလက် */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="font-bold mb-4">Payment Slip</h3>
                            <a
                                href={`/storage/${order.payment_slip}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {order?.payment_slip ? (
                                    <img
                                        src={`/storage/${order.payment_slip}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowSlip(true);
                                        }}
                                        className="w-full h-auto rounded-lg border hover:opacity-90 transition cursor-zoom-in"
                                        alt="Payment Slip"
                                    />
                                ) : (
                                    <div className="h-40 w-full rounded-lg border bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
                                        No slip uploaded
                                    </div>
                                )}
                            </a>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="font-bold mb-2">Customer Info</h3>
                            <p className="text-sm">
                                <b>Name:</b> {customer?.name || "Unknown"}
                            </p>
                            <p className="text-sm">
                                <b>Phone:</b> {order?.phone || "N/A"}
                            </p>
                            <p className="text-sm">
                                <b>Address:</b> {order?.address || "N/A"}
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="font-bold mb-2">Slip Verification</h3>
                            <p className="text-sm text-slate-600">
                                Verdict:{" "}
                                <span className="font-semibold">
                                    {order?.slip_verdict || "not_checked"}
                                </span>
                            </p>
                            <p className="text-sm text-slate-600">
                                Score:{" "}
                                <span className="font-semibold">
                                    {order?.slip_score ?? "-"}
                                </span>
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Checked:{" "}
                                {order?.slip_checked_at
                                    ? new Date(
                                          order.slip_checked_at,
                                      ).toLocaleString()
                                    : "N/A"}
                            </p>

                            <button
                                className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                onClick={() =>
                                    Swal.fire({
                                        title: "Verify slip?",
                                        text: "This will run OCR/heuristics.",
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonText: "Run",
                                    }).then((result) => {
                                        if (!result.isConfirmed) return;
                                        router.post(
                                            route("admin.orders.verifySlip", order.id),
                                            {},
                                            {
                                                onSuccess: () =>
                                                    Swal.fire(
                                                        "Done",
                                                        "Slip verification completed.",
                                                        "success",
                                                    ),
                                            },
                                        );
                                    })
                                }
                                disabled={!order?.payment_slip}
                            >
                                Verify Slip
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="font-bold mb-2">Delivery Tracking</h3>
                            {liveOrder?.delivery_lat && liveOrder?.delivery_lng ? (
                                <>
                                    <p className="text-sm text-slate-600">
                                        Location: {liveOrder.delivery_lat},{" "}
                                        {liveOrder.delivery_lng}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Updated:{" "}
                                        {liveOrder.delivery_updated_at
                                            ? new Date(
                                                  liveOrder.delivery_updated_at,
                                              ).toLocaleString()
                                            : "N/A"}
                                    </p>
                                    <div className="mt-3">
                                        <iframe
                                            title="delivery-map"
                                            className="w-full h-48 rounded border"
                                            src={`https://www.openstreetmap.org/?mlat=${liveOrder.delivery_lat}&mlon=${liveOrder.delivery_lng}#map=14/${liveOrder.delivery_lat}/${liveOrder.delivery_lng}`}
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-slate-400">
                                    No location update yet.
                                </p>
                            )}

                            {["admin", "manager", "delivery"].includes(role) && (
                                <form
                                    className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = new FormData(e.currentTarget);
                                        const delivery_lat = form.get("delivery_lat");
                                        const delivery_lng = form.get("delivery_lng");
                                        router.patch(
                                            route("admin.orders.updateLocation", order.id),
                                            { delivery_lat, delivery_lng },
                                            {
                                                onSuccess: () =>
                                                    Swal.fire(
                                                        "Updated",
                                                        "Location saved.",
                                                        "success",
                                                    ),
                                            },
                                        );
                                    }}
                                >
                                    <input
                                        name="delivery_lat"
                                        placeholder="Latitude"
                                        className="border rounded-lg px-3 py-2 text-sm"
                                    />
                                    <input
                                        name="delivery_lng"
                                        placeholder="Longitude"
                                        className="border rounded-lg px-3 py-2 text-sm"
                                    />
                                    <button className="bg-slate-800 text-white rounded-lg px-3 py-2 text-sm">
                                        Update Location
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showSlip && order?.payment_slip && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setShowSlip(false)}
                >
                    <div
                        className="max-w-3xl w-full bg-white rounded-2xl p-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-slate-800">
                                Payment Slip
                            </h4>
                            <button
                                className="text-slate-500 hover:text-slate-800"
                                onClick={() => setShowSlip(false)}
                            >
                                Close
                            </button>
                        </div>
                        <img
                            src={`/storage/${order.payment_slip}`}
                            className="w-full h-auto rounded-lg border"
                            alt="Payment Slip"
                        />
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
