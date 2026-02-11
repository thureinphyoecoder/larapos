import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Swal from "sweetalert2";
import { sanitizePaginationLabel } from "@/utils/sanitizePaginationLabel";

export default function Index({ orders }) {
    const rows = orders?.data || [];
    const groupedOrders = groupByDate(rows);

    const cancelOrder = (id) => {
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
            router.patch(route("orders.cancel", id), { cancel_reason: result.value || "" }, {
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

            <div className="max-w-5xl mx-auto space-y-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
                    <p className="text-sm text-gray-500 mt-1">Grouped by date for easier tracking.</p>
                </div>

                {rows.length ? (
                    groupedOrders.map((section) => (
                        <section key={section.date} className="space-y-3">
                            <div className="sticky top-20 z-10 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-bold uppercase tracking-wider text-orange-700">
                                {section.label}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {section.items.map((order) => (
                                    <article key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">Order #{order.id}</p>
                                                <p className="text-xs text-gray-500 mt-1">{formatDateTime(order.created_at)}</p>
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>

                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                                                <p className="text-[11px] uppercase tracking-wider text-gray-500">Total</p>
                                                <p className="font-black text-gray-900">{Number(order.total_amount).toLocaleString()} MMK</p>
                                            </div>
                                            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                                                <p className="text-[11px] uppercase tracking-wider text-gray-500">Payment Slip</p>
                                                <p className="font-semibold text-gray-700">{order.payment_slip ? "Uploaded" : "Not uploaded"}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                                            <Link href={route("orders.show", order.id)} className="rounded-lg bg-orange-600 px-3 py-1.5 font-semibold text-white hover:bg-orange-700">
                                                View
                                            </Link>

                                            {order.status === "pending" && (
                                                <button onClick={() => cancelOrder(order.id)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100">
                                                    Cancel
                                                </button>
                                            )}

                                            {(["confirmed", "shipped"].includes(order.status) && order.payment_slip) && (
                                                <button onClick={() => requestRefund(order.id)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-100">
                                                    Request Refund
                                                </button>
                                            )}

                                            {order.status === "delivered" && (
                                                <button onClick={() => requestReturn(order.id)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 font-semibold text-amber-700 hover:bg-amber-100">
                                                    Request Return
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 italic">
                        No orders yet.
                    </div>
                )}

                {orders?.links?.length > 1 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-2">
                        {orders.links.map((link, idx) => (
                            <Link
                                key={`${link.label}-${idx}`}
                                href={link.url || "#"}
                                className={`px-3 py-1 rounded border text-sm ${
                                    link.active
                                        ? "bg-orange-600 text-white border-orange-600"
                                        : "bg-white text-gray-600 border-gray-200"
                                } ${!link.url ? "opacity-50 pointer-events-none" : ""}`}
                            >
                                {sanitizePaginationLabel(link.label)}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function groupByDate(orders) {
    const groups = new Map();

    orders.forEach((order) => {
        const dateKey = toDateKey(order.created_at);
        const list = groups.get(dateKey) || [];
        list.push(order);
        groups.set(dateKey, list);
    });

    return Array.from(groups.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, items]) => ({
            date,
            label: formatDateHeading(date),
            items,
        }));
}

function toDateKey(value) {
    if (!value) return "unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "unknown";

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatDateHeading(dateKey) {
    if (dateKey === "unknown") return "Unknown Date";
    const date = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateKey;
    return date.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
}

function StatusBadge({ status }) {
    if (status === "pending") return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">pending</span>;
    if (status === "confirmed") return <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase text-sky-700">confirmed</span>;
    if (status === "shipped") return <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase text-indigo-700">shipped</span>;
    if (status === "delivered") return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-700">delivered</span>;
    if (status === "cancelled") return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase text-rose-700">cancelled</span>;

    return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase text-gray-700">{status}</span>;
}
