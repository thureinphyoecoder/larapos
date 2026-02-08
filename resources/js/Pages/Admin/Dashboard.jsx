import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";

const PERIODS = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
];

export default function Dashboard({
    stats,
    recentOrders,
    dailySales = [],
    salesTrends = {},
    teamAttendance = [],
    stockByShop = [],
    transferTrend = [],
}) {
    const [orders, setOrders] = useState(recentOrders || []);
    const [liveStats, setLiveStats] = useState(stats || {});
    const [period, setPeriod] = useState("daily");

    useEffect(() => {
        if (!window.Echo) return;

        window.Echo.channel("admin-notifications").listen(".NewOrderPlaced", (e) => {
            if (e?.order) {
                setOrders((prev) => [e.order, ...prev].slice(0, 10));
            }
            setLiveStats((prev) => ({
                ...prev,
                total_orders: Number(prev.total_orders || 0) + 1,
            }));
        });

        return () => {
            if (window.Echo) {
                window.Echo.leaveChannel("admin-notifications");
            }
        };
    }, []);

    const trendData = salesTrends?.[period]?.length
        ? salesTrends[period]
        : dailySales;

    const maxTrendValue = useMemo(
        () => trendData.reduce((max, item) => Math.max(max, Number(item.total || 0)), 0),
        [trendData],
    );
    const chartPoints = useMemo(() => {
        const width = 920;
        const height = 250;
        const left = 28;
        const right = width - 28;
        const top = 18;
        const bottom = height - 30;
        const usableWidth = right - left;
        const usableHeight = bottom - top;
        const denominator = Math.max(1, maxTrendValue);

        return trendData.map((item, idx) => {
            const ratioX = trendData.length <= 1 ? 0 : idx / (trendData.length - 1);
            const ratioY = Number(item.total || 0) / denominator;
            return {
                x: left + ratioX * usableWidth,
                y: bottom - ratioY * usableHeight,
                value: Number(item.total || 0),
                label: item.label || item.date,
            };
        });
    }, [trendData, maxTrendValue]);

    const linePath = useMemo(() => {
        if (!chartPoints.length) return "";
        return chartPoints.map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    }, [chartPoints]);

    const areaPath = useMemo(() => {
        if (!chartPoints.length) return "";
        const baseline = 220;
        const first = chartPoints[0];
        const last = chartPoints[chartPoints.length - 1];
        return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
    }, [chartPoints, linePath]);

    const maxShopStock = useMemo(
        () => stockByShop.reduce((max, item) => Math.max(max, Number(item.total_stock || 0)), 0),
        [stockByShop],
    );

    const maxTransferQty = useMemo(
        () => transferTrend.reduce((max, item) => Math.max(max, Number(item.qty || 0)), 0),
        [transferTrend],
    );

    return (
        <AdminLayout>
            <Head title="Super Admin Dashboard" />

            <div className="space-y-6">
                <section className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 text-white shadow-2xl">
                    <div className="px-6 sm:px-8 py-6 sm:py-7 bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.35),_transparent_42%)]">
                        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-300 font-bold">
                                    Super Admin Control Center
                                </p>
                                <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
                                    Revenue Trend Overview
                                </h1>
                                <p className="mt-2 text-sm text-slate-300">
                                    Daily, weekly, monthly, yearly sales chart for executive monitoring.
                                </p>
                            </div>

                            <div className="inline-flex p-1 rounded-2xl bg-white/10 border border-white/20">
                                {PERIODS.map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => setPeriod(p.key)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                                            period === p.key
                                                ? "bg-white text-slate-900"
                                                : "text-slate-200 hover:text-white"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                            <div className="lg:col-span-9">
                                <div className="h-56 sm:h-64 rounded-2xl border border-white/10 bg-black/15 p-4 overflow-hidden">
                                    {chartPoints.length ? (
                                        <svg viewBox="0 0 920 250" className="w-full h-full">
                                            <defs>
                                                <linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#fb923c" stopOpacity="0.55" />
                                                    <stop offset="100%" stopColor="#fb923c" stopOpacity="0.04" />
                                                </linearGradient>
                                                <linearGradient id="salesLine" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#f97316" />
                                                    <stop offset="100%" stopColor="#facc15" />
                                                </linearGradient>
                                            </defs>

                                            {[0, 1, 2, 3].map((step) => {
                                                const y = 30 + step * 48;
                                                return (
                                                    <line
                                                        key={`grid-${step}`}
                                                        x1="28"
                                                        y1={y}
                                                        x2="892"
                                                        y2={y}
                                                        stroke="rgba(255,255,255,0.12)"
                                                        strokeDasharray="4 6"
                                                    />
                                                );
                                            })}

                                            <path d={areaPath} fill="url(#salesArea)" />
                                            <path d={linePath} fill="none" stroke="url(#salesLine)" strokeWidth="4" strokeLinecap="round" />

                                            {chartPoints.map((point, idx) => (
                                                <g key={`point-${idx}`}>
                                                    <circle cx={point.x} cy={point.y} r="4.5" fill="#fb923c" stroke="#fff" strokeWidth="1.4" />
                                                    <text x={point.x} y="242" textAnchor="middle" fontSize="11" fill="rgba(226,232,240,0.95)">
                                                        {point.label}
                                                    </text>
                                                </g>
                                            ))}
                                        </svg>
                                    ) : (
                                        <div className="h-full w-full grid place-items-center text-slate-400 text-sm">No chart data available.</div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-3 space-y-3">
                                <MetricPill label="Total Sales" value={`${liveStats.total_sales || 0} MMK`} />
                                <MetricPill label="Total Orders" value={liveStats.total_orders || 0} />
                                <MetricPill label="Checked In Staff" value={liveStats.checked_in_staff ?? 0} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <StatCard label="Active Shops" value={liveStats.active_shops || 0} tone="sky" />
                    <StatCard label="System Users" value={liveStats.system_users || 0} tone="violet" />
                    <StatCard label="Orders" value={liveStats.total_orders || 0} tone="emerald" />
                    <StatCard label="Low Stock Shops" value={stockByShop.filter((s) => Number(s.low_stock_variants || 0) > 0).length} tone="amber" />
                    <StatCard label="Tracked Staff" value={teamAttendance.length} tone="rose" />
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Stock by Shop</h3>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">Live inventory</span>
                        </div>
                        <div className="p-5 space-y-3">
                            {stockByShop.length ? (
                                stockByShop.map((item, idx) => (
                                    <div key={item.id ?? `${item.shop}-${idx}`} className="flex items-center gap-3">
                                        <div className="w-28 text-xs text-slate-500 truncate">{item.shop}</div>
                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                                style={{
                                                    width:
                                                        maxShopStock === 0
                                                            ? "0%"
                                                            : `${(Number(item.total_stock || 0) / maxShopStock) * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <div className="w-28 text-right text-sm font-semibold text-slate-700">
                                            {Number(item.total_stock || 0).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400">No stock records yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Transfer Trend (7 days)</h3>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">Shared qty</span>
                        </div>
                        <div className="p-5 space-y-3">
                            {transferTrend.length ? (
                                transferTrend.map((item) => (
                                    <div key={item.date} className="flex items-center gap-3">
                                        <div className="w-24 text-xs text-slate-500">
                                            {new Date(item.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                                style={{
                                                    width:
                                                        maxTransferQty === 0
                                                            ? "0%"
                                                            : `${(Number(item.qty || 0) / maxTransferQty) * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <div className="w-12 text-right text-sm font-semibold text-slate-700">
                                            {Number(item.qty || 0)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400">No transfer activity yet.</p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Recent Orders</h3>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Realtime feed</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-5 py-3 font-bold">Order</th>
                                    <th className="px-5 py-3 font-bold">Customer</th>
                                    <th className="px-5 py-3 font-bold">Shop</th>
                                    <th className="px-5 py-3 font-bold">Amount</th>
                                    <th className="px-5 py-3 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.length ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-5 py-3 font-bold text-slate-800">#{order.id}</td>
                                            <td className="px-5 py-3 text-slate-600">{order.user?.name || "Customer not set"}</td>
                                            <td className="px-5 py-3 text-slate-600">{order.shop?.name || "Shop not assigned"}</td>
                                            <td className="px-5 py-3 font-semibold text-slate-800">
                                                {Number(order.total_amount || 0).toLocaleString()} MMK
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-100 text-emerald-700">
                                                    {order.status || "pending"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-slate-400">
                                            No orders available yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

function StatCard({ label, value, tone = "sky" }) {
    const tones = {
        sky: "from-sky-500 to-cyan-400",
        violet: "from-violet-500 to-fuchsia-400",
        emerald: "from-emerald-500 to-lime-400",
        amber: "from-amber-500 to-orange-400",
        rose: "from-rose-500 to-pink-400",
    };

    return (
        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">{label}</p>
            <div className="mt-3 flex items-center justify-between">
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <div className={`h-2 w-12 rounded-full bg-gradient-to-r ${tones[tone] || tones.sky}`}></div>
            </div>
        </div>
    );
}

function MetricPill({ label, value }) {
    return (
        <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
            <p className="text-[11px] uppercase tracking-widest text-slate-300 font-bold">{label}</p>
            <p className="mt-1 text-lg font-black text-white">{value}</p>
        </div>
    );
}
