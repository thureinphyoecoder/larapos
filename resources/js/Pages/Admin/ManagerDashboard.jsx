import React, { useMemo } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";

export default function ManagerDashboard({
    stats,
    recentOrders,
    dailySales = [],
    shop,
    teamAttendance = [],
    dailyClosings = [],
}) {
    const closeForm = useForm({
        date: new Date().toISOString().slice(0, 10),
        shop_id: String(shop?.id || ""),
    });

    const activeStaffCount = useMemo(
        () => teamAttendance.filter((row) => row.checked_in).length,
        [teamAttendance],
    );

    return (
        <AdminLayout header="Manager Dashboard">
            <Head title="Manager Dashboard" />

            <div className="space-y-6">
                <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white p-6 shadow">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Shop Manager Console</p>
                    <h2 className="mt-2 text-2xl font-black">{shop?.name || "Shop"} Operations Overview</h2>
                    <p className="mt-2 text-sm text-white/80">
                        End-of-day report ကို ဒီနေရာကနေတင်ပြီး Super Admin ကို တန်းမြင်အောင်လုပ်ပါ။
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Shop Sales" value={`${stats?.shop_sales || 0} MMK`} />
                    <StatCard label="Total Orders" value={stats?.total_orders || 0} />
                    <StatCard label="Pending" value={stats?.pending_orders || 0} />
                    <StatCard label="Active Staff Now" value={`${activeStaffCount}/${stats?.team_members || 0}`} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-800 mb-4">Sales (Last 7 Days)</h3>
                        <div className="space-y-3">
                            {dailySales.map((d) => (
                                <div key={d.date} className="flex items-center gap-4">
                                    <div className="w-24 text-xs text-slate-500">{new Date(d.date).toLocaleDateString()}</div>
                                    <div className="flex-1 h-2.5 bg-slate-100 rounded">
                                        <div
                                            className="h-2.5 bg-emerald-500 rounded"
                                            style={{ width: `${Math.min(100, Number(d.total) / 2000)}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-28 text-right text-sm font-bold text-slate-700">
                                        {Number(d.total).toLocaleString()} MMK
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-900">Submit End-of-Day Report</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            ဆိုင်ပိတ်ခါနီး report တင်ပါ။ Super Admin dashboard မှာချက်ချင်းပေါ်ပါမယ်။
                        </p>
                        <form
                            className="mt-4 space-y-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                closeForm.post(route("admin.service-jobs.daily-close"), {
                                    preserveScroll: true,
                                });
                            }}
                        >
                            <input
                                type="date"
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                value={closeForm.data.date}
                                onChange={(event) => closeForm.setData("date", event.target.value)}
                                required
                            />
                            <button
                                className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                                disabled={closeForm.processing}
                            >
                                {closeForm.processing ? "Submitting..." : "Submit Daily Close"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50">
                            <h3 className="font-bold text-slate-800">Recent Daily Close Reports</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-400 uppercase text-[11px] border-b border-slate-50">
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Orders</th>
                                        <th className="px-6 py-3">Net</th>
                                        <th className="px-6 py-3">Submitted By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dailyClosings?.length ? (
                                        dailyClosings.map((row) => (
                                            <tr key={row.id}>
                                                <td className="px-6 py-3">{new Date(row.business_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-3">{row.orders_count}</td>
                                                <td className="px-6 py-3 font-semibold">{Number(row.net_amount).toLocaleString()} MMK</td>
                                                <td className="px-6 py-3">{row.closed_by || "System"}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                                                No daily close reports yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50">
                            <h3 className="font-bold text-slate-800">Team Active Status</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {teamAttendance?.length ? (
                                teamAttendance.map((member) => (
                                    <div key={member.id} className="px-6 py-3 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-800">{member.name}</p>
                                            <p className="text-xs text-slate-500 uppercase">{member.role}</p>
                                        </div>
                                        <span
                                            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                                                member.checked_in
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {member.checked_in ? "active now" : "offline"}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-10 text-center text-slate-400">No team members found.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50">
                        <h3 className="font-bold text-slate-800">Recent Shop Orders</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-400 uppercase text-[11px] border-b border-slate-50">
                                    <th className="px-6 py-3">Order</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentOrders?.length ? (
                                    recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-6 py-3 font-bold text-slate-700">#{order.id}</td>
                                            <td className="px-6 py-3">{order.user?.name || "Unknown"}</td>
                                            <td className="px-6 py-3 font-semibold">
                                                {Number(order.total_amount).toLocaleString()} MMK
                                            </td>
                                            <td className="px-6 py-3 uppercase">{order.status}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                                            No orders yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{value}</p>
        </div>
    );
}
