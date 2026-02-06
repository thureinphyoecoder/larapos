import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Swal from "sweetalert2";

export default function Index({ orders }) {
    const rows = orders?.data || [];

    const cancelOrder = (id) => {
        Swal.fire({
            title: "Cancel order?",
            text: "Only pending orders can be cancelled.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Cancel",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.patch(route("orders.cancel", id), {}, {
                onSuccess: () => Swal.fire("Cancelled", "Order cancelled.", "success"),
            });
        });
    };

    const requestRefund = (id) => {
        Swal.fire({
            title: "Request refund?",
            text: "Admin will review and process your refund.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Request",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.post(route("orders.refund", id), {}, {
                onSuccess: () => Swal.fire("Requested", "Refund requested.", "success"),
            });
        });
    };

    const requestReturn = (id) => {
        Swal.fire({
            title: "Request return?",
            text: "Please provide a reason for return.",
            input: "textarea",
            inputPlaceholder: "Reason...",
            showCancelButton: true,
            confirmButtonText: "Request",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.post(route("orders.return", id), { return_reason: result.value || "" }, {
                onSuccess: () => Swal.fire("Requested", "Return requested.", "success"),
            });
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="My Orders" />

            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 text-[11px] uppercase tracking-widest border-b border-gray-100">
                                <th className="px-6 py-4 font-bold">Order ID</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold">Total</th>
                                <th className="px-6 py-4 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length ? (
                                rows.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/80 transition">
                                        <td className="px-6 py-4 font-semibold text-gray-700 text-sm">#{order.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 uppercase">{order.status}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            {Number(order.total_amount).toLocaleString()} MMK
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={route("orders.show", order.id)}
                                                    className="text-orange-600 font-semibold hover:underline"
                                                >
                                                    View
                                                </Link>
                                                {order.status === "pending" && (
                                                    <button
                                                        onClick={() => cancelOrder(order.id)}
                                                        className="text-red-500 font-semibold hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {(["confirmed", "shipped"].includes(order.status) && order.payment_slip) && (
                                                    <button
                                                        onClick={() => requestRefund(order.id)}
                                                        className="text-blue-600 font-semibold hover:underline"
                                                    >
                                                        Request Refund
                                                    </button>
                                                )}
                                                {order.status === "delivered" && (
                                                    <button
                                                        onClick={() => requestReturn(order.id)}
                                                        className="text-amber-600 font-semibold hover:underline"
                                                    >
                                                        Request Return
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-gray-400 italic">
                                        No orders yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {orders?.links?.length > 1 && (
                    <div className="p-6 flex flex-wrap gap-2">
                        {orders.links.map((link, idx) => (
                            <Link
                                key={`${link.label}-${idx}`}
                                href={link.url || "#"}
                                className={`px-3 py-1 rounded border text-sm ${
                                    link.active
                                        ? "bg-orange-600 text-white border-orange-600"
                                        : "bg-white text-gray-600 border-gray-200"
                                } ${!link.url ? "opacity-50 pointer-events-none" : ""}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
