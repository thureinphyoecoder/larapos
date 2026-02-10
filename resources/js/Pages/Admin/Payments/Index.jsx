import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { sanitizePaginationLabel } from "@/utils/sanitizePaginationLabel";

export default function PaymentsIndex({ orders, payments, approvals, adjustments, filters = {} }) {
    const [q, setQ] = useState(filters?.q || "");
    const [status, setStatus] = useState(filters?.status || "");

    const approvalForm = useForm({
        order_id: "",
        request_type: "refund",
        amount: "",
        reason: "",
    });

    const adjustmentForm = useForm({
        order_id: "",
        adjustment_type: "adjustment",
        amount: "",
        reason: "",
        approval_request_id: "",
    });

    const rows = orders?.data || [];
    const approvalRows = approvals?.data || [];
    const adjustmentRows = adjustments?.data || [];
    const paymentRows = payments?.data || [];

    const totals = useMemo(() => {
        return rows.reduce(
            (acc, order) => {
                acc.gross += Number(order.total_amount || 0);
                if (["refund_requested", "refunded", "returned"].includes(order.status)) {
                    acc.refund += Number(order.total_amount || 0);
                }
                return acc;
            },
            { gross: 0, refund: 0 },
        );
    }, [rows]);

    const pendingApprovals = useMemo(
        () => approvalRows.filter((row) => row.status === "pending"),
        [approvalRows],
    );

    const orderAmountById = useMemo(() => {
        const map = new Map();
        for (const row of rows) {
            map.set(String(row.id), Number(row.total_amount || 0));
        }
        return map;
    }, [rows]);

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(
            route("admin.payments.index"),
            {
                q: q || undefined,
                status: status || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AdminLayout header="Payments">
            <Head title="Payments" />

            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Finance Console</p>
                            <h1 className="mt-2 text-2xl font-black text-slate-900">Payments & Approvals</h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Refund, verification, rejection, and adjustment workflow ကို တစ်နေရာတည်းကနေ စီမံနိုင်ပါတယ်။
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <MetricCard label="Orders (Current Page)" value={rows.length} />
                        <MetricCard label="Gross Amount" value={`${totals.gross.toLocaleString()} MMK`} tone="emerald" />
                        <MetricCard label="Potential Refund" value={`${totals.refund.toLocaleString()} MMK`} tone="rose" />
                    </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h2 className="text-lg font-black text-slate-900">Find Order</h2>
                    <form onSubmit={submitFilters} className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_220px_140px_140px] gap-3">
                        <input
                            className="border border-slate-300 rounded-xl px-3 py-2.5"
                            placeholder="Invoice / Receipt / Customer"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <select className="border border-slate-300 rounded-xl px-3 py-2.5" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="">All status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="refund_requested">Refund Requested</option>
                            <option value="refunded">Refunded</option>
                            <option value="returned">Returned</option>
                        </select>
                        <button className="bg-slate-900 text-white rounded-xl font-bold text-sm">Apply</button>
                        <Link href={route("admin.payments.index")} className="text-center border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-600 text-sm">
                            Reset
                        </Link>
                    </form>
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="font-black text-slate-900">Request Approval</h3>
                        <form
                            className="mt-4 space-y-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                approvalForm.post(route("admin.payments.approvals.store"), { preserveScroll: true });
                            }}
                        >
                            <select
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                value={approvalForm.data.order_id}
                                onChange={(e) => {
                                    const orderId = e.target.value;
                                    approvalForm.setData("order_id", orderId);
                                    const amount = orderAmountById.get(orderId);
                                    if (amount !== undefined) {
                                        approvalForm.setData("amount", String(amount));
                                    }
                                }}
                                required
                            >
                                <option value="">Select order</option>
                                {rows.map((order) => (
                                    <option key={order.id} value={order.id}>
                                        {order.invoice_no || `#${order.id}`} - {order.user?.name || "Unknown"}
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <select
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    value={approvalForm.data.request_type}
                                    onChange={(e) => {
                                        const requestType = e.target.value;
                                        approvalForm.setData("request_type", requestType);
                                        if (requestType === "refund") {
                                            const amount = orderAmountById.get(String(approvalForm.data.order_id));
                                            if (amount !== undefined) {
                                                approvalForm.setData("amount", String(amount));
                                            }
                                        }
                                    }}
                                >
                                    <option value="refund">Refund</option>
                                    <option value="discount">Discount</option>
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    placeholder="Amount"
                                    value={approvalForm.data.amount}
                                    onChange={(e) => approvalForm.setData("amount", e.target.value)}
                                />
                            </div>
                            <input
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                placeholder="Reason"
                                value={approvalForm.data.reason}
                                onChange={(e) => approvalForm.setData("reason", e.target.value)}
                                required
                            />
                            {approvalForm.errors?.order_id && <InlineError text={approvalForm.errors.order_id} />}
                            {approvalForm.errors?.reason && <InlineError text={approvalForm.errors.reason} />}
                            <button className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold disabled:opacity-60" disabled={approvalForm.processing}>
                                {approvalForm.processing ? "Submitting..." : "Submit Request"}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-slate-900">Pending Approvals</h3>
                            <span className="text-xs font-bold rounded-full px-2 py-1 bg-amber-100 text-amber-700 uppercase tracking-wider">
                                {pendingApprovals.length}
                            </span>
                        </div>
                        <div className="mt-4 space-y-3 max-h-[360px] overflow-auto">
                            {pendingApprovals.length ? (
                                pendingApprovals.map((row) => (
                                    <div key={row.id} className="border border-slate-200 rounded-xl p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-semibold text-slate-900">#{row.id} {row.request_type}</p>
                                            <span className="text-xs uppercase text-amber-700 bg-amber-100 px-2 py-1 rounded-full font-bold">pending</span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1">{row.order?.invoice_no || row.order_id}</p>
                                        <p className="text-sm text-slate-500">{row.reason}</p>
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                                                onClick={() => router.post(route("admin.payments.approvals.approve", row.id), {}, { preserveScroll: true })}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                                                onClick={() => router.post(route("admin.payments.approvals.reject", row.id), {}, { preserveScroll: true })}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">No pending approval on this page.</p>
                            )}
                        </div>
                        <PaginationLinks links={approvals?.links} />
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <QuickEventCard
                        title="Verify Payment"
                        actionRoute="admin.payments.orders.verify"
                        orders={rows}
                        buttonClass="bg-emerald-600"
                    />
                    <QuickEventCard
                        title="Reject Payment"
                        actionRoute="admin.payments.orders.reject"
                        orders={rows}
                        buttonClass="bg-rose-600"
                    />
                    <QuickEventCard
                        title="Refund Payment"
                        actionRoute="admin.payments.orders.refund"
                        orders={rows}
                        buttonClass="bg-orange-600"
                    />
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h3 className="font-black text-slate-900">Order Payment List</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="py-2 text-left">Invoice</th>
                                    <th className="py-2 text-left">Receipt</th>
                                    <th className="py-2 text-left">Customer</th>
                                    <th className="py-2 text-left">Amount</th>
                                    <th className="py-2 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length ? (
                                    rows.map((order) => (
                                        <tr key={order.id} className="border-b border-slate-100">
                                            <td className="py-2 font-semibold">{order.invoice_no || "-"}</td>
                                            <td className="py-2">{order.receipt_no || "-"}</td>
                                            <td className="py-2">{order.user?.name || "-"}</td>
                                            <td className="py-2">{Number(order.total_amount || 0).toLocaleString()} MMK</td>
                                            <td className="py-2">{order.status}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">No orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks links={orders?.links} />
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="font-black text-slate-900">Record Financial Adjustment</h3>
                        <form
                            className="mt-4 space-y-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                adjustmentForm.post(route("admin.payments.adjustments.store"), { preserveScroll: true });
                            }}
                        >
                            <select
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                value={adjustmentForm.data.order_id}
                                onChange={(e) => {
                                    const orderId = e.target.value;
                                    adjustmentForm.setData("order_id", orderId);
                                    const amount = orderAmountById.get(orderId);
                                    if (amount !== undefined) {
                                        adjustmentForm.setData("amount", String(amount));
                                    }
                                }}
                                required
                            >
                                <option value="">Select order</option>
                                {rows.map((order) => (
                                    <option key={order.id} value={order.id}>
                                        {order.invoice_no || `#${order.id}`} - {order.user?.name || "Unknown"}
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <select
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    value={adjustmentForm.data.adjustment_type}
                                    onChange={(e) => adjustmentForm.setData("adjustment_type", e.target.value)}
                                >
                                    <option value="adjustment">Adjustment</option>
                                    <option value="reversal">Reversal</option>
                                </select>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    placeholder="Amount"
                                    value={adjustmentForm.data.amount}
                                    onChange={(e) => adjustmentForm.setData("amount", e.target.value)}
                                    required
                                />
                            </div>
                            <input
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                placeholder="Reason"
                                value={adjustmentForm.data.reason}
                                onChange={(e) => adjustmentForm.setData("reason", e.target.value)}
                                required
                            />
                            <select
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                value={adjustmentForm.data.approval_request_id}
                                onChange={(e) => adjustmentForm.setData("approval_request_id", e.target.value)}
                            >
                                <option value="">Link approval (optional)</option>
                                {approvalRows.map((row) => (
                                    <option key={row.id} value={row.id}>
                                        #{row.id} - {row.request_type} ({row.status})
                                    </option>
                                ))}
                            </select>
                            {adjustmentForm.errors?.order_id && <InlineError text={adjustmentForm.errors.order_id} />}
                            {adjustmentForm.errors?.amount && <InlineError text={adjustmentForm.errors.amount} />}
                            <button className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold disabled:opacity-60" disabled={adjustmentForm.processing}>
                                {adjustmentForm.processing ? "Saving..." : "Save Adjustment"}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="font-black text-slate-900">Financial Adjustments</h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="py-2 text-left">ID</th>
                                        <th className="py-2 text-left">Order</th>
                                        <th className="py-2 text-left">Type</th>
                                        <th className="py-2 text-left">Amount</th>
                                        <th className="py-2 text-left">By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adjustmentRows.length ? (
                                        adjustmentRows.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-100">
                                                <td className="py-2">#{row.id}</td>
                                                <td className="py-2">{row.order?.invoice_no || row.order_id}</td>
                                                <td className="py-2">{row.adjustment_type}</td>
                                                <td className="py-2">{Number(row.amount).toLocaleString()} MMK</td>
                                                <td className="py-2">{row.creator?.name || "-"}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-400">No adjustments yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationLinks links={adjustments?.links} />
                    </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h3 className="font-black text-slate-900">Payment Ledger Events</h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="py-2 text-left">Time</th>
                                    <th className="py-2 text-left">Order</th>
                                    <th className="py-2 text-left">Event</th>
                                    <th className="py-2 text-left">Amount</th>
                                    <th className="py-2 text-left">Status</th>
                                    <th className="py-2 text-left">Actor</th>
                                    <th className="py-2 text-left">Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentRows.length ? (
                                    paymentRows.map((row) => (
                                        <tr key={row.id} className="border-b border-slate-100">
                                            <td className="py-2">{new Date(row.created_at).toLocaleString()}</td>
                                            <td className="py-2">{row.order?.invoice_no || row.order_id}</td>
                                            <td className="py-2 uppercase text-xs font-bold">{row.event_type}</td>
                                            <td className="py-2">{Number(row.amount).toLocaleString()} {row.currency || "MMK"}</td>
                                            <td className="py-2">{row.status}</td>
                                            <td className="py-2">{row.actor?.name || "system"}</td>
                                            <td className="py-2">{row.note || "-"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-slate-400">No ledger records yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationLinks links={payments?.links} />
                </section>
            </div>
        </AdminLayout>
    );
}

function PaginationLinks({ links }) {
    if (!links || links.length <= 1) return null;
    return (
        <div className="mt-4 flex flex-wrap gap-2">
            {links.map((link, idx) => (
                <Link
                    key={`${link.label}-${idx}`}
                    href={link.url || "#"}
                    className={`px-3 py-1.5 rounded-lg border text-sm ${
                        link.active
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200"
                    } ${!link.url ? "opacity-50 pointer-events-none" : ""}`}
                >
                    {sanitizePaginationLabel(link.label)}
                </Link>
            ))}
        </div>
    );
}

function MetricCard({ label, value, tone = "slate" }) {
    const toneStyles = {
        slate: "text-slate-900 border-slate-200",
        emerald: "text-emerald-700 border-emerald-200",
        rose: "text-rose-700 border-rose-200",
    };

    return (
        <div className={`bg-white border rounded-2xl p-4 ${toneStyles[tone] || toneStyles.slate}`}>
            <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-black">{value}</p>
        </div>
    );
}

function InlineError({ text }) {
    return <p className="text-xs text-rose-600 font-medium">{text}</p>;
}

function QuickEventCard({ title, actionRoute, orders, buttonClass }) {
    const isRefundAction = actionRoute === "admin.payments.orders.refund";
    const isRejectAction = actionRoute === "admin.payments.orders.reject";
    const isVerifyAction = actionRoute === "admin.payments.orders.verify";
    const form = useForm({
        order_id: "",
        amount: "",
        reference_no: "",
        note: "",
    });

    const orderAmountById = useMemo(() => {
        const map = new Map();
        for (const row of orders) {
            map.set(String(row.id), Number(row.total_amount || 0));
        }
        return map;
    }, [orders]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h4 className="font-black text-slate-900">{title}</h4>
            <form
                className="mt-3 space-y-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!form.data.order_id) return;
                    form.post(route(actionRoute, form.data.order_id), { preserveScroll: true });
                }}
            >
                <select
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    value={form.data.order_id}
                    onChange={(e) => {
                        const orderId = e.target.value;
                        form.setData("order_id", orderId);
                        if (isVerifyAction) {
                            const amount = orderAmountById.get(orderId);
                            if (amount !== undefined) {
                                form.setData("amount", String(amount));
                            }
                        }
                    }}
                    required
                >
                    <option value="">Select order</option>
                    {orders.map((order) => (
                        <option key={order.id} value={order.id}>
                            {order.invoice_no || `#${order.id}`} - {order.user?.name || "Unknown"}
                        </option>
                    ))}
                </select>

                {isRefundAction ? (
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        Refund amount will use full order total automatically.
                    </p>
                ) : isRejectAction ? null : (
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border border-slate-300 rounded-xl px-3 py-2"
                        placeholder={isVerifyAction ? "Amount (auto-filled)" : "Amount"}
                        value={form.data.amount}
                        onChange={(e) => form.setData("amount", e.target.value)}
                    />
                )}

                <input
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    placeholder="Reference No (optional)"
                    value={form.data.reference_no}
                    onChange={(e) => form.setData("reference_no", e.target.value)}
                />
                <input
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    placeholder={isRejectAction || isRefundAction ? "Reason" : "Note"}
                    value={form.data.note}
                    onChange={(e) => form.setData("note", e.target.value)}
                    required={!isVerifyAction}
                />
                <button className={`w-full text-white rounded-xl py-2 font-bold disabled:opacity-60 ${buttonClass}`} disabled={form.processing}>
                    {form.processing ? "Saving..." : "Save Event"}
                </button>
            </form>
        </div>
    );
}
