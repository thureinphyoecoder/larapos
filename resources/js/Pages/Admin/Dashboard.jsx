import React, { useEffect, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, usePage } from "@inertiajs/react";

export default function Dashboard({ stats, recentOrders, dailySales = [] }) {
    const { auth } = usePage().props;
    const role = auth?.role || "admin";
    const [orders, setOrders] = useState(recentOrders || []);
    const [liveStats, setLiveStats] = useState(stats);

    useEffect(() => {
        if (window.Echo) {
            window.Echo.channel("admin-notifications").listen(
                ".NewOrderPlaced",
                (e) => {
                    if (e?.order) {
                        setOrders((prev) => [e.order, ...prev].slice(0, 10));
                    }
                    setLiveStats((prev) => ({
                        ...prev,
                        total_orders: Number(prev.total_orders || 0) + 1,
                    }));
                },
            );
        }

        return () => {
            if (window.Echo) {
                window.Echo.leaveChannel("admin-notifications");
            }
        };
    }, []);

    const roleLabels = {
        admin: "Admin Command",
        manager: "Manager Console",
        sales: "Sales Desk",
        delivery: "Delivery Hub",
    };

    const roleAccent = {
        admin: "from-slate-900 via-slate-800 to-slate-700",
        manager: "from-emerald-700 via-emerald-600 to-teal-500",
        sales: "from-orange-600 via-amber-500 to-yellow-400",
        delivery: "from-sky-700 via-sky-600 to-cyan-500",
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-8">
                {/* Hero */}
                <div
                    className={`rounded-3xl p-6 sm:p-8 text-white shadow-lg bg-gradient-to-br ${roleAccent[role] || roleAccent.admin}`}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                                {roleLabels[role] || "Admin Console"}
                            </p>
                            <h1 className="mt-2 text-2xl sm:text-3xl font-black">
                                LaraPee Operations
                            </h1>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30">
                                Role: {role}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30">
                                Live Orders
                            </span>
                        </div>
                    </div>
                </div>
                {/* 📊 Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label="Total Sales"
                        value={liveStats.total_sales}
                        icon="💰"
                        color="bg-blue-500"
                    />
                    <StatCard
                        label="Active Shops"
                        value={liveStats.active_shops}
                        icon="🏪"
                        color="bg-orange-500"
                    />
                    <StatCard
                        label="Total Orders"
                        value={liveStats.total_orders}
                        icon="📦"
                        color="bg-green-500"
                    />
                    <StatCard
                        label="System Users"
                        value={liveStats.system_users}
                        icon="👥"
                        color="bg-purple-500"
                    />
                </div>

                {/* 🛒 Recent Orders Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">
                            Recent Orders
                        </h3>
                        <span className="text-xs text-slate-400 uppercase tracking-widest">
                            Live feed
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4 font-bold">
                                        Order ID
                                    </th>
                                    <th className="px-6 py-4 font-bold">
                                        Customer
                                    </th>
                                    <th className="px-6 py-4 font-bold">
                                        Shop
                                    </th>
                                    <th className="px-6 py-4 font-bold">
                                        Amount
                                    </th>
                                    <th className="px-6 py-4 font-bold">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-slate-50/80 transition"
                                        >
                                            <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {order.user?.name || "Unknown"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {order.shop?.name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                                {order.total_amount} MMK
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black uppercase rounded-full">
                                                    Completed
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="p-20 text-center text-slate-400 italic"
                                        >
                                            No orders available yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 📈 Sales Trend (Last 7 Days) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">
                            Sales (Last 7 Days)
                        </h3>
                        <span className="text-xs text-slate-400">
                            Non-cancelled orders
                        </span>
                    </div>
                    <div className="p-6">
                        {dailySales.length ? (
                            <div className="space-y-3">
                                {dailySales.map((d) => (
                                    <div key={d.date} className="flex items-center gap-4">
                                        <div className="w-24 text-xs text-slate-500">
                                            {new Date(d.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex-1 h-3 bg-slate-100 rounded">
                                            <div
                                                className="h-3 bg-orange-500 rounded"
                                                style={{
                                                    width:
                                                        dailySales.reduce(
                                                            (m, x) => Math.max(m, x.total),
                                                            0,
                                                        ) === 0
                                                            ? "0%"
                                                            : `${(d.total / dailySales.reduce(
                                                                  (m, x) => Math.max(m, x.total),
                                                                  0,
                                                              )) * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <div className="w-28 text-right text-sm font-semibold text-slate-700">
                                            {Number(d.total).toLocaleString()} MMK
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-10">
                                No sales data yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Role Focus */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                            Focus
                        </p>
                        <p className="mt-2 font-semibold text-slate-800">
                            {role === "sales" &&
                                "Today’s orders and quick approvals"}
                            {role === "manager" &&
                                "Inventory flow and team performance"}
                            {role === "delivery" &&
                                "Route updates and delivery status"}
                            {role === "admin" &&
                                "Revenue, operations, and compliance"}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                            Priority
                        </p>
                        <p className="mt-2 font-semibold text-slate-800">
                            {role === "sales" && "Confirm pending orders fast"}
                            {role === "manager" && "Resolve low stock alerts"}
                            {role === "delivery" && "Update live locations"}
                            {role === "admin" && "Review refund requests"}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                            Tip
                        </p>
                        <p className="mt-2 font-semibold text-slate-800">
                            {role === "sales" &&
                                "Use order filters to batch confirm"}
                            {role === "manager" &&
                                "Assign staff to high-demand shops"}
                            {role === "delivery" &&
                                "Pin routes for faster updates"}
                            {role === "admin" &&
                                "Audit slips before confirming refunds"}
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

// Stats Card Component
function StatCard({ label, value, icon, color }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div
                className={`w-12 h-12 ${color} text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-inner`}
            >
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                    {label}
                </p>
                <p className="text-xl font-black text-slate-800 leading-tight">
                    {value}
                </p>
            </div>
        </div>
    );
}
