import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";

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

    const submitFilters = (event) => {
        event.preventDefault();
        window.location.href = route("admin.payments.index", {
            q: q || undefined,
            status: status || undefined,
        });
    };

    return (
        <AdminLayout header="Payments">
            <Head title="Payments" />

            <div className="space-y-6">
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    ငွေပေးချေမှုစာမျက်နှာကို ရိုးရှင်းစွာ ပြန်စီထားပါတယ်။ အပေါ်က Filter နဲ့ order ရှာပြီး အောက်မှာ approve/refund/reject ကိုတန်းလုပ်နိုင်ပါတယ်။
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard label="ပြနေသော Orders" value={rows.length} />
                    <MetricCard label="စုစုပေါင်း ရောင်းအား" value={`${totals.gross.toLocaleString()} MMK`} tone="emerald" />
                    <MetricCard label="Refund အလားအလာ" value={`${totals.refund.toLocaleString()} MMK`} tone="rose" />
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h3 className="font-black text-slate-900">Order ငွေပေးချေမှုစာရင်း</h3>
                    <form onSubmit={submitFilters} className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                            className="border border-slate-300 rounded-xl px-3 py-2.5"
                            placeholder="Invoice / Receipt / Customer ရှာမည်"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <select className="border border-slate-300 rounded-xl px-3 py-2.5" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="">Status အားလုံး</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="refund_requested">Refund Requested</option>
                            <option value="refunded">Refunded</option>
                            <option value="returned">Returned</option>
                        </select>
                        <button className="bg-slate-900 text-white rounded-xl font-bold">စစ်ထုတ်မည်</button>
                        <a href={route("admin.payments.index")} className="text-center border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-600">
                            ပြန်ဖြုတ်မည်
                        </a>
                    </form>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="py-2 text-left">Invoice</th>
                                    <th className="py-2 text-left">Receipt</th>
                                    <th className="py-2 text-left">Customer</th>
                                    <th className="py-2 text-left">ပမာဏ</th>
                                    <th className="py-2 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((order) => (
                                    <tr key={order.id} className="border-b border-slate-100">
                                        <td className="py-2 font-semibold">{order.invoice_no || "-"}</td>
                                        <td className="py-2">{order.receipt_no || "-"}</td>
                                        <td className="py-2">{order.user?.name || "-"}</td>
                                        <td className="py-2">{Number(order.total_amount || 0).toLocaleString()} MMK</td>
                                        <td className="py-2">{order.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="font-black text-slate-900">Approval တင်မည်</h3>
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
                                onChange={(e) => approvalForm.setData("order_id", e.target.value)}
                                required
                            >
                                <option value="">Order ရွေးပါ</option>
                                {rows.map((order) => (
                                    <option key={order.id} value={order.id}>
                                        {order.invoice_no || `#${order.id}`} - {order.user?.name}
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    value={approvalForm.data.request_type}
                                    onChange={(e) => approvalForm.setData("request_type", e.target.value)}
                                >
                                    <option value="refund">Refund</option>
                                    <option value="discount">Discount</option>
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    placeholder="ပမာဏ (optional)"
                                    value={approvalForm.data.amount}
                                    onChange={(e) => approvalForm.setData("amount", e.target.value)}
                                />
                            </div>
                            <input
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                placeholder="အကြောင်းပြချက်"
                                value={approvalForm.data.reason}
                                onChange={(e) => approvalForm.setData("reason", e.target.value)}
                                required
                            />
                            <button className="w-full bg-orange-600 text-white rounded-xl py-2.5 font-bold">တင်ပို့မည်</button>
                        </form>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="font-black text-slate-900">ငွေစာရင်း ပြင်ဆင်ချက်ထည့်မည်</h3>
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
                                onChange={(e) => adjustmentForm.setData("order_id", e.target.value)}
                                required
                            >
                                <option value="">Order ရွေးပါ</option>
                                {rows.map((order) => (
                                    <option key={order.id} value={order.id}>
                                        {order.invoice_no || `#${order.id}`} - {order.user?.name}
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
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
                                    placeholder="ပမာဏ"
                                    value={adjustmentForm.data.amount}
                                    onChange={(e) => adjustmentForm.setData("amount", e.target.value)}
                                    required
                                />
                            </div>
                            <input
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                placeholder="အကြောင်းပြချက်"
                                value={adjustmentForm.data.reason}
                                onChange={(e) => adjustmentForm.setData("reason", e.target.value)}
                                required
                            />
                            <select
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                value={adjustmentForm.data.approval_request_id}
                                onChange={(e) => adjustmentForm.setData("approval_request_id", e.target.value)}
                            >
                                <option value="">ချိတ်မည့် approval (optional)</option>
                                {approvalRows.map((row) => (
                                    <option key={row.id} value={row.id}>
                                        #{row.id} - {row.request_type} ({row.status})
                                    </option>
                                ))}
                            </select>
                            <button className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold">သိမ်းမည်</button>
                        </form>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h3 className="font-black text-slate-900">Payment Ledger Events</h3>
                    <p className="text-xs text-slate-500 mt-1">Verify / Reject / Refund လုပ်တိုင်း ledger entry အသစ်တစ်ကြောင်းတိုးပါမည်။</p>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="py-2 text-left">အချိန်</th>
                                    <th className="py-2 text-left">Order</th>
                                    <th className="py-2 text-left">Event</th>
                                    <th className="py-2 text-left">ပမာဏ</th>
                                    <th className="py-2 text-left">Status</th>
                                    <th className="py-2 text-left">လုပ်ဆောင်သူ</th>
                                    <th className="py-2 text-left">မှတ်ချက်</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentRows.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-100">
                                        <td className="py-2">{new Date(row.created_at).toLocaleString()}</td>
                                        <td className="py-2">{row.order?.invoice_no || row.order_id}</td>
                                        <td className="py-2 uppercase text-xs font-bold">{row.event_type}</td>
                                        <td className="py-2">{Number(row.amount).toLocaleString()} {row.currency || "MMK"}</td>
                                        <td className="py-2">{row.status}</td>
                                        <td className="py-2">{row.actor?.name || "system"}</td>
                                        <td className="py-2">{row.note || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="font-black text-slate-900">Approval Requests</h3>
                        <div className="mt-4 space-y-3 max-h-[460px] overflow-auto">
                            {approvalRows.map((row) => (
                                <div key={row.id} className="border border-slate-200 rounded-xl p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-slate-900">#{row.id} {row.request_type}</p>
                                        <span className="text-xs uppercase tracking-wider text-slate-500">{row.status}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">Order: {row.order?.invoice_no || row.order_id}</p>
                                    <p className="text-sm text-slate-600">Reason: {row.reason}</p>
                                    {row.status === "pending" ? (
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
                                    ) : null}
                                </div>
                            ))}
                        </div>
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
                                    {adjustmentRows.map((row) => (
                                        <tr key={row.id} className="border-b border-slate-100">
                                            <td className="py-2">#{row.id}</td>
                                            <td className="py-2">{row.order?.invoice_no || row.order_id}</td>
                                            <td className="py-2">{row.adjustment_type}</td>
                                            <td className="py-2">{Number(row.amount).toLocaleString()} MMK</td>
                                            <td className="py-2">{row.creator?.name || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                </div>
            </div>
        </AdminLayout>
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

function QuickEventCard({ title, actionRoute, orders, buttonClass }) {
    const form = useForm({
        order_id: "",
        amount: "",
        reference_no: "",
        note: "",
    });

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
                    onChange={(e) => form.setData("order_id", e.target.value)}
                    required
                >
                    <option value="">Select order</option>
                    {orders.map((order) => (
                        <option key={order.id} value={order.id}>
                            {order.invoice_no || `#${order.id}`} - {order.user?.name}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    placeholder="Amount"
                    value={form.data.amount}
                    onChange={(e) => form.setData("amount", e.target.value)}
                />
                <input
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    placeholder="Reference No (optional)"
                    value={form.data.reference_no}
                    onChange={(e) => form.setData("reference_no", e.target.value)}
                />
                <input
                    className="w-full border border-slate-300 rounded-xl px-3 py-2"
                    placeholder="Note"
                    value={form.data.note}
                    onChange={(e) => form.setData("note", e.target.value)}
                    required={actionRoute !== "admin.payments.orders.verify"}
                />
                <button className={`w-full text-white rounded-xl py-2 font-bold ${buttonClass}`}>
                    Save Event
                </button>
            </form>
        </div>
    );
}
