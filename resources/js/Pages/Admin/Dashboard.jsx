import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";

const PERIODS = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
];

const ORDER_STATUS_TONES = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-sky-100 text-sky-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    refunded: "bg-fuchsia-100 text-fuchsia-700",
    returned: "bg-violet-100 text-violet-700",
};

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
    const [dailySeries, setDailySeries] = useState(dailySales || []);
    const [trendSeries, setTrendSeries] = useState(salesTrends || {});
    const [attendanceSeries, setAttendanceSeries] = useState(teamAttendance || []);
    const [stockSeries, setStockSeries] = useState(stockByShop || []);
    const [transferSeries, setTransferSeries] = useState(transferTrend || []);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState(() => new Date());
    const [period, setPeriod] = useState("daily");

    useEffect(() => {
        setOrders(recentOrders || []);
        setLiveStats(stats || {});
        setDailySeries(dailySales || []);
        setTrendSeries(salesTrends || {});
        setAttendanceSeries(teamAttendance || []);
        setStockSeries(stockByShop || []);
        setTransferSeries(transferTrend || []);
        setLastSyncAt(new Date());
    }, [recentOrders, stats, dailySales, salesTrends, teamAttendance, stockByShop, transferTrend]);

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

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            router.reload({
                only: [
                    "stats",
                    "recentOrders",
                    "dailySales",
                    "salesTrends",
                    "teamAttendance",
                    "stockByShop",
                    "transferTrend",
                ],
                preserveState: true,
                preserveScroll: true,
                onStart: () => setRefreshing(true),
                onFinish: () => setRefreshing(false),
            });
        }, 20000);

        return () => window.clearInterval(intervalId);
    }, []);

    const stockSummary = useMemo(() => {
        const grouped = stockSeries.reduce((acc, item) => {
            const key = item.shop || "Unknown Shop";
            if (!acc[key]) {
                acc[key] = {
                    shop: key,
                    total_stock: 0,
                    low_stock_variants: 0,
                };
            }
            acc[key].total_stock += Number(item.total_stock || 0);
            acc[key].low_stock_variants += Number(item.low_stock_variants || 0);
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => Number(b.total_stock || 0) - Number(a.total_stock || 0));
    }, [stockSeries]);

    const transferSummary = useMemo(() => {
        const grouped = transferSeries.reduce((acc, item) => {
            const key = item.date || "";
            if (!acc[key]) {
                acc[key] = { date: key, qty: 0 };
            }
            acc[key].qty += Number(item.qty || 0);
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [transferSeries]);

    const trendData = trendSeries?.[period]?.length
        ? trendSeries[period]
        : dailySeries;

    const maxTrendValue = useMemo(
        () => trendData.reduce((max, item) => Math.max(max, Number(item.total || 0)), 0),
        [trendData],
    );

    const chartPoints = useMemo(() => {
        const width = 920;
        const height = 210;
        const left = 28;
        const right = width - 28;
        const top = 16;
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
        const baseline = 180;
        const first = chartPoints[0];
        const last = chartPoints[chartPoints.length - 1];
        return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
    }, [chartPoints, linePath]);

    const maxShopStock = useMemo(
        () => stockSummary.reduce((max, item) => Math.max(max, Number(item.total_stock || 0)), 0),
        [stockSummary],
    );

    const maxTransferQty = useMemo(
        () => transferSummary.reduce((max, item) => Math.max(max, Number(item.qty || 0)), 0),
        [transferSummary],
    );

    return (
        <AdminLayout>
            <Head title="Super Admin Dashboard" />

            <div className="space-y-6">
                <section className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 text-white shadow-2xl">
                    <div className="px-6 sm:px-8 py-6 sm:py-7 bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.35),_transparent_42%)]">
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] items-center gap-4">
                            <div className="inline-flex p-1 rounded-2xl bg-white/10 border border-white/20 justify-self-start">
                                {PERIODS.map((p) => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => setPeriod(p.key)}
                                        className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition ${
                                            period === p.key
                                                ? "bg-white text-slate-900"
                                                : "text-slate-200 hover:text-white"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            <h1 className="text-center text-2xl sm:text-3xl font-black tracking-tight">
                                Revenue Overview
                            </h1>

                            <div className="hidden xl:block justify-self-end text-xs uppercase tracking-widest text-slate-300 font-bold">
                                Realtime Chart
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                            <div className="xl:flex-1">
                                <div className="h-44 sm:h-52 rounded-2xl border border-white/10 bg-black/15 p-4 overflow-hidden">
                                    {chartPoints.length ? (
                                        <svg viewBox="0 0 920 210" className="w-full h-full">
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

                                            {[0, 1, 2].map((step) => {
                                                const y = 35 + step * 42;
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
                                                    <circle cx={point.x} cy={point.y} r="3.8" fill="#fb923c" stroke="#fff" strokeWidth="1.2" />
                                                    <text x={point.x} y="202" textAnchor="middle" fontSize="11" fill="rgba(226,232,240,0.95)">
                                                        {point.label}
                                                    </text>
                                                </g>
                                            ))}
                                        </svg>
                                    ) : (
                                        <div className="h-full w-full grid place-items-center text-slate-400 text-sm">No revenue data yet.</div>
                                    )}
                                </div>
                            </div>

                            <div className="xl:w-[22rem] space-y-3">
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
                    <StatCard label="Low Stock Shops" value={stockSummary.filter((s) => Number(s.low_stock_variants || 0) > 0).length} tone="amber" />
                    <StatCard label="Tracked Staff" value={attendanceSeries.length} tone="rose" />
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-slate-900">Stock by Shop</h3>
                                <p className="text-xs text-slate-500 mt-1">Realtime inventory balance per branch</p>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                    <span className={`h-2 w-2 rounded-full ${refreshing ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
                                    {refreshing ? "Syncing" : "Live"}
                                </span>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    {lastSyncAt.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            {stockSummary.length ? (
                                stockSummary.map((item, idx) => (
                                    <div key={`${item.shop}-${idx}`} className="rounded-2xl border border-slate-100 p-3.5 bg-slate-50/60">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="text-sm font-bold text-slate-700 truncate">{item.shop}</div>
                                            <div className="text-xs text-slate-500">
                                                Low stock: <span className="font-bold text-slate-700">{Number(item.low_stock_variants || 0)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-3.5 bg-slate-200/70 rounded-full overflow-hidden">
                                                <div
                                                    className="h-3.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-700"
                                                    style={{
                                                        width:
                                                            maxShopStock === 0
                                                                ? "0%"
                                                                : `${(Number(item.total_stock || 0) / maxShopStock) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="w-24 text-right text-sm font-black text-slate-800">
                                                {Number(item.total_stock || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400">No stock records yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-slate-900">Transfer Trend (7 days)</h3>
                                <p className="text-xs text-slate-500 mt-1">Inter-shop stock sharing performance</p>
                            </div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Shared qty</span>
                        </div>
                        <div className="p-5 space-y-3.5">
                            {transferSummary.length ? (
                                transferSummary.map((item) => (
                                    <div key={item.date} className="rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 flex items-center gap-3">
                                        <div className="w-24 text-xs text-slate-500">
                                            {new Date(item.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex-1 h-3.5 bg-slate-200/70 rounded-full overflow-hidden">
                                            <div
                                                className="h-3.5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 transition-all duration-700"
                                                style={{
                                                    width:
                                                        maxTransferQty === 0
                                                            ? "0%"
                                                            : `${(Number(item.qty || 0) / maxTransferQty) * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <div className="w-14 text-right text-sm font-black text-slate-800">
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
                                    orders.map((order) => {
                                        const statusKey = String(order.status || "pending").toLowerCase();
                                        const tone = ORDER_STATUS_TONES[statusKey] || "bg-slate-100 text-slate-700";
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50/70 transition">
                                                <td className="px-5 py-3 font-bold text-slate-800">#{order.id}</td>
                                                <td className="px-5 py-3 text-slate-600">{order.user?.name || "Customer not set"}</td>
                                                <td className="px-5 py-3 text-slate-600">{order.shop?.name || "Shop not assigned"}</td>
                                                <td className="px-5 py-3 font-semibold text-slate-800">
                                                    {Number(order.total_amount || 0).toLocaleString()} MMK
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${tone}`}>
                                                        {order.status || "pending"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
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
        sky: {
            bar: "from-sky-500 to-cyan-400",
            card: "from-sky-50 to-cyan-50",
            dot: "bg-cyan-500",
        },
        violet: {
            bar: "from-violet-500 to-fuchsia-400",
            card: "from-violet-50 to-fuchsia-50",
            dot: "bg-fuchsia-500",
        },
        emerald: {
            bar: "from-emerald-500 to-lime-400",
            card: "from-emerald-50 to-lime-50",
            dot: "bg-emerald-500",
        },
        amber: {
            bar: "from-amber-500 to-orange-400",
            card: "from-amber-50 to-orange-50",
            dot: "bg-amber-500",
        },
        rose: {
            bar: "from-rose-500 to-pink-400",
            card: "from-rose-50 to-pink-50",
            dot: "bg-rose-500",
        },
    };
    const style = tones[tone] || tones.sky;

    return (
        <div className={`rounded-2xl border border-slate-100 bg-gradient-to-br ${style.card} p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">{label}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`}></span>
            </div>
            <div className="mt-3 flex items-center justify-between">
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <div className={`h-2 w-14 rounded-full bg-gradient-to-r ${style.bar}`}></div>
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
