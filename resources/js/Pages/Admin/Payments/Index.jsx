import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    FaArrowRotateLeft,
    FaClipboardList,
    FaFilter,
    FaPenToSquare,
    FaSackDollar,
    FaWallet,
    FaXmark,
} from "react-icons/fa6";
import { sanitizePaginationLabel } from "@/utils/sanitizePaginationLabel";

const STATUS_OPTIONS = [
    { value: "", label: "အားလုံး" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "refund_requested", label: "Refund Requested" },
    { value: "refunded", label: "Refunded" },
    { value: "returned", label: "Returned" },
];

function PaginationLinks({ links }) {
    if (!links || links.length <= 1) return null;

    return (
        <div className="mt-4 flex flex-wrap gap-2">
            {links.map((link, idx) => (
                <Link
                    key={`${link.label}-${idx}`}
                    href={link.url || "#"}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                        link.active
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    } ${!link.url ? "pointer-events-none opacity-40" : ""}`}
                >
                    {sanitizePaginationLabel(link.label)}
                </Link>
            ))}
        </div>
    );
}

function TabButton({ active, onClick, label, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
        >
            {label}
            <span className="ml-2 text-xs opacity-80">{count}</span>
        </button>
    );
}

function Modal({ open, title, children, onClose }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="close"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <FaXmark className="h-4 w-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function FieldLabel({ children }) {
    return <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{children}</label>;
}

function Input(props) {
    return (
        <input
            {...props}
            className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/30 ${props.className || ""}`}
        />
    );
}

function Select({ options, ...props }) {
    return (
        <select
            {...props}
            className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/30 ${props.className || ""}`}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

export default function PaymentsIndex({ orders, payments, approvals, adjustments, filters = {} }) {
    const [q, setQ] = useState(filters?.q || "");
    const [status, setStatus] = useState(filters?.status || "");
    const [activeTab, setActiveTab] = useState("orders");
    const [modal, setModal] = useState({ open: false, type: null });

    const quickForm = useForm({ order_id: "", amount: "", reference_no: "", note: "" });
    const approvalForm = useForm({ order_id: "", request_type: "refund", amount: "", reason: "" });
    const adjustmentForm = useForm({
        order_id: "",
        adjustment_type: "adjustment",
        amount: "",
        reason: "",
        approval_request_id: "",
    });

    const rows = orders?.data || [];
    const paymentRows = payments?.data || [];
    const approvalRows = approvals?.data || [];
    const adjustmentRows = adjustments?.data || [];
    const pendingApprovals = useMemo(() => approvalRows.filter((x) => x.status === "pending"), [approvalRows]);

    const totals = useMemo(
        () =>
            rows.reduce(
                (acc, order) => {
                    const amount = Number(order.total_amount || 0);
                    acc.gross += amount;
                    if (["refund_requested", "refunded", "returned"].includes(order.status)) {
                        acc.refund += amount;
                    }
                    return acc;
                },
                { gross: 0, refund: 0 },
            ),
        [rows],
    );

    const orderOptions = useMemo(
        () => [
            { value: "", label: "Order ရွေးချယ်ပါ" },
            ...rows.map((order) => ({
                value: String(order.id),
                label: `${order.invoice_no || `#${order.id}`} - ${order.user?.name || "Unknown"}`,
            })),
        ],
        [rows],
    );

    const amountByOrderId = useMemo(() => {
        const map = new Map();
        rows.forEach((order) => map.set(String(order.id), String(Number(order.total_amount || 0))));
        return map;
    }, [rows]);

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(
            route("admin.payments.index"),
            { q: q || undefined, status: status || undefined },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        setQ("");
        setStatus("");
        router.get(route("admin.payments.index"), {}, { preserveState: true, replace: true });
    };

    const openQuickModal = (type, order = null) => {
        const orderId = order ? String(order.id) : "";
        quickForm.setData({
            order_id: orderId,
            amount: orderId ? amountByOrderId.get(orderId) || "" : "",
            reference_no: "",
            note: "",
        });
        setModal({ open: true, type });
    };

    const closeModal = () => {
        setModal({ open: false, type: null });
        quickForm.clearErrors();
        approvalForm.clearErrors();
        adjustmentForm.clearErrors();
    };

    const submitQuickEvent = (event) => {
        event.preventDefault();
        const routeByType = {
            verify: "admin.payments.orders.verify",
            reject: "admin.payments.orders.reject",
            refund: "admin.payments.orders.refund",
        };
        const routeName = routeByType[modal.type];
        if (!routeName || !quickForm.data.order_id) return;

        quickForm.post(route(routeName, quickForm.data.order_id), {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    const submitApproval = (event) => {
        event.preventDefault();
        approvalForm.post(route("admin.payments.approvals.store"), {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    const submitAdjustment = (event) => {
        event.preventDefault();
        adjustmentForm.post(route("admin.payments.adjustments.store"), {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    };

    return (
        <AdminLayout header="Payment Management">
            <Head title="Payment Management" />

            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                            <FaWallet className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">Payment Console</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Tabs + modals workflow for faster operations</p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Orders</p>
                            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{rows.length}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                            <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">Gross</p>
                            <p className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-200">{totals.gross.toLocaleString()} MMK</p>
                        </div>
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                            <p className="text-xs font-bold uppercase text-rose-700 dark:text-rose-300">Refund Risk</p>
                            <p className="mt-1 text-2xl font-black text-rose-800 dark:text-rose-200">{totals.refund.toLocaleString()} MMK</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <form onSubmit={submitFilters} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_220px_auto_auto]">
                        <Input
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder="Invoice / Receipt / Customer"
                        />
                        <Select options={STATUS_OPTIONS} value={status} onChange={(event) => setStatus(event.target.value)} />
                        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
                            <FaFilter className="h-3.5 w-3.5" />
                            Filter
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <FaArrowRotateLeft className="h-3.5 w-3.5" />
                            Reset
                        </button>
                    </form>
                </section>

                <section className="flex flex-wrap gap-2">
                    <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")} label="Orders" count={rows.length} />
                    <TabButton active={activeTab === "approvals"} onClick={() => setActiveTab("approvals")} label="Approvals" count={pendingApprovals.length} />
                    <TabButton active={activeTab === "adjustments"} onClick={() => setActiveTab("adjustments")} label="Adjustments" count={adjustmentRows.length} />
                    <TabButton active={activeTab === "ledger"} onClick={() => setActiveTab("ledger")} label="Ledger" count={paymentRows.length} />
                </section>

                {activeTab === "orders" && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Order Payments</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                        <th className="py-2">Invoice</th>
                                        <th className="py-2">Customer</th>
                                        <th className="py-2">Amount</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length > 0 ? rows.map((order) => (
                                        <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">{order.invoice_no || `#${order.id}`}</td>
                                            <td className="py-3 text-slate-600 dark:text-slate-300">{order.user?.name || "—"}</td>
                                            <td className="py-3 font-bold text-slate-800 dark:text-slate-100">{Number(order.total_amount || 0).toLocaleString()} MMK</td>
                                            <td className="py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">{order.status}</span></td>
                                            <td className="py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => openQuickModal("verify", order)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Verify</button>
                                                    <button type="button" onClick={() => openQuickModal("reject", order)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white">Reject</button>
                                                    <button type="button" onClick={() => openQuickModal("refund", order)} className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white">Refund</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="py-10 text-center text-slate-400">Orders မတွေ့ပါ</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationLinks links={orders?.links} />
                    </section>
                )}

                {activeTab === "approvals" && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Pending Approvals</h2>
                            <button
                                type="button"
                                onClick={() => setModal({ open: true, type: "approval" })}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white"
                            >
                                <FaPenToSquare className="h-3.5 w-3.5" />
                                New Request
                            </button>
                        </div>

                        <div className="space-y-2">
                            {pendingApprovals.length > 0 ? pendingApprovals.map((row) => (
                                <div key={row.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">#{row.id} • {row.request_type}</p>
                                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold uppercase text-amber-700 dark:bg-amber-400/20 dark:text-amber-300">pending</span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{row.order?.invoice_no || `#${row.order_id}`} • {row.reason}</p>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => router.post(route("admin.payments.approvals.approve", row.id), {}, { preserveScroll: true })}
                                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => router.post(route("admin.payments.approvals.reject", row.id), {}, { preserveScroll: true })}
                                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p className="py-10 text-center text-sm text-slate-400">စောင့်ဆိုင်းနေသော approval မရှိပါ</p>
                            )}
                        </div>
                        <PaginationLinks links={approvals?.links} />
                    </section>
                )}

                {activeTab === "adjustments" && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Financial Adjustments</h2>
                            <button
                                type="button"
                                onClick={() => setModal({ open: true, type: "adjustment" })}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900"
                            >
                                <FaSackDollar className="h-3.5 w-3.5" />
                                New Adjustment
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                        <th className="py-2">#</th>
                                        <th className="py-2">Order</th>
                                        <th className="py-2">Type</th>
                                        <th className="py-2">Amount</th>
                                        <th className="py-2">By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adjustmentRows.length > 0 ? adjustmentRows.map((row) => (
                                        <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">#{row.id}</td>
                                            <td className="py-3 text-slate-600 dark:text-slate-300">{row.order?.invoice_no || row.order_id}</td>
                                            <td className="py-3 uppercase text-slate-600 dark:text-slate-300">{row.adjustment_type}</td>
                                            <td className="py-3 font-bold text-slate-800 dark:text-slate-100">{Number(row.amount).toLocaleString()} MMK</td>
                                            <td className="py-3 text-slate-600 dark:text-slate-300">{row.creator?.name || "—"}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="py-10 text-center text-slate-400">Adjustments မရှိသေးပါ</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationLinks links={adjustments?.links} />
                    </section>
                )}

                {activeTab === "ledger" && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-3 flex items-center gap-2">
                            <FaClipboardList className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Payment Ledger</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                        <th className="py-2">Time</th>
                                        <th className="py-2">Order</th>
                                        <th className="py-2">Event</th>
                                        <th className="py-2">Amount</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Actor</th>
                                        <th className="py-2">Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentRows.length > 0 ? paymentRows.map((row) => (
                                        <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="py-3 text-xs text-slate-500 dark:text-slate-400">{new Date(row.created_at).toLocaleString()}</td>
                                            <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">{row.order?.invoice_no || row.order_id}</td>
                                            <td className="py-3 uppercase text-indigo-600 dark:text-indigo-300">{row.event_type}</td>
                                            <td className="py-3 font-bold text-slate-800 dark:text-slate-100">{Number(row.amount).toLocaleString()} {row.currency || "MMK"}</td>
                                            <td className="py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">{row.status}</span></td>
                                            <td className="py-3 text-slate-600 dark:text-slate-300">{row.actor?.name || "system"}</td>
                                            <td className="py-3 text-slate-600 dark:text-slate-300">{row.note || "—"}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={7} className="py-10 text-center text-slate-400">Ledger မှတ်တမ်း မရှိသေးပါ</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationLinks links={payments?.links} />
                    </section>
                )}
            </div>

            <Modal
                open={modal.open && ["verify", "reject", "refund"].includes(modal.type)}
                title={modal.type === "verify" ? "Verify Payment" : modal.type === "reject" ? "Reject Payment" : "Refund Payment"}
                onClose={closeModal}
            >
                <form onSubmit={submitQuickEvent} className="space-y-3">
                    <div>
                        <FieldLabel>Order</FieldLabel>
                        <Select
                            options={orderOptions}
                            value={quickForm.data.order_id}
                            onChange={(event) => {
                                const orderId = event.target.value;
                                quickForm.setData("order_id", orderId);
                                if (modal.type !== "reject") {
                                    quickForm.setData("amount", amountByOrderId.get(orderId) || "");
                                }
                            }}
                            required
                        />
                    </div>

                    {modal.type !== "reject" && (
                        <div>
                            <FieldLabel>Amount</FieldLabel>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={quickForm.data.amount}
                                onChange={(event) => quickForm.setData("amount", event.target.value)}
                            />
                        </div>
                    )}

                    <div>
                        <FieldLabel>Reference No (optional)</FieldLabel>
                        <Input
                            value={quickForm.data.reference_no}
                            onChange={(event) => quickForm.setData("reference_no", event.target.value)}
                        />
                    </div>

                    <div>
                        <FieldLabel>{modal.type === "verify" ? "Note" : "Reason"}</FieldLabel>
                        <Input
                            value={quickForm.data.note}
                            onChange={(event) => quickForm.setData("note", event.target.value)}
                            required={modal.type !== "verify"}
                        />
                    </div>

                    <button
                        className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
                        disabled={quickForm.processing}
                    >
                        {quickForm.processing ? "Saving..." : "Save"}
                    </button>
                </form>
            </Modal>

            <Modal open={modal.open && modal.type === "approval"} title="Request Approval" onClose={closeModal}>
                <form onSubmit={submitApproval} className="space-y-3">
                    <div>
                        <FieldLabel>Order</FieldLabel>
                        <Select
                            options={orderOptions}
                            value={approvalForm.data.order_id}
                            onChange={(event) => {
                                const orderId = event.target.value;
                                approvalForm.setData("order_id", orderId);
                                approvalForm.setData("amount", amountByOrderId.get(orderId) || "");
                            }}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <FieldLabel>Type</FieldLabel>
                            <Select
                                options={[
                                    { value: "refund", label: "Refund" },
                                    { value: "discount", label: "Discount" },
                                ]}
                                value={approvalForm.data.request_type}
                                onChange={(event) => approvalForm.setData("request_type", event.target.value)}
                            />
                        </div>
                        <div>
                            <FieldLabel>Amount</FieldLabel>
                            <Input
                                type="number"
                                min="0"
                                value={approvalForm.data.amount}
                                onChange={(event) => approvalForm.setData("amount", event.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <FieldLabel>Reason</FieldLabel>
                        <Input
                            value={approvalForm.data.reason}
                            onChange={(event) => approvalForm.setData("reason", event.target.value)}
                            required
                        />
                    </div>

                    <button
                        className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-black text-white disabled:opacity-60"
                        disabled={approvalForm.processing}
                    >
                        {approvalForm.processing ? "Submitting..." : "Submit"}
                    </button>
                </form>
            </Modal>

            <Modal open={modal.open && modal.type === "adjustment"} title="Financial Adjustment" onClose={closeModal}>
                <form onSubmit={submitAdjustment} className="space-y-3">
                    <div>
                        <FieldLabel>Order</FieldLabel>
                        <Select
                            options={orderOptions}
                            value={adjustmentForm.data.order_id}
                            onChange={(event) => {
                                const orderId = event.target.value;
                                adjustmentForm.setData("order_id", orderId);
                                adjustmentForm.setData("amount", amountByOrderId.get(orderId) || "");
                            }}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <FieldLabel>Type</FieldLabel>
                            <Select
                                options={[
                                    { value: "adjustment", label: "Adjustment" },
                                    { value: "reversal", label: "Reversal" },
                                ]}
                                value={adjustmentForm.data.adjustment_type}
                                onChange={(event) => adjustmentForm.setData("adjustment_type", event.target.value)}
                            />
                        </div>
                        <div>
                            <FieldLabel>Amount</FieldLabel>
                            <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={adjustmentForm.data.amount}
                                onChange={(event) => adjustmentForm.setData("amount", event.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <FieldLabel>Reason</FieldLabel>
                        <Input
                            value={adjustmentForm.data.reason}
                            onChange={(event) => adjustmentForm.setData("reason", event.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <FieldLabel>Link Approval (optional)</FieldLabel>
                        <Select
                            options={[
                                { value: "", label: "Select approval" },
                                ...approvalRows.map((row) => ({
                                    value: String(row.id),
                                    label: `#${row.id} - ${row.request_type} (${row.status})`,
                                })),
                            ]}
                            value={adjustmentForm.data.approval_request_id}
                            onChange={(event) => adjustmentForm.setData("approval_request_id", event.target.value)}
                        />
                    </div>

                    <button
                        className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
                        disabled={adjustmentForm.processing}
                    >
                        {adjustmentForm.processing ? "Saving..." : "Save"}
                    </button>
                </form>
            </Modal>
        </AdminLayout>
    );
}
