import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, usePage } from "@inertiajs/react";
import {
    LuArrowLeftRight,
    LuShoppingCart,
    LuChartColumn,
    LuChartLine,
    LuChevronLeft,
    LuChevronRight,
    LuClipboardList,
    LuClock3,
    LuBanknote,
    LuStore,
    LuTriangleAlert,
    LuUserCheck,
    LuUsers,
} from "react-icons/lu";

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
    managerCloseStatus = [],
}) {
    const { auth = {} } = usePage().props;
    const role = auth?.role || "admin";
    const user = auth?.user || null;
    const [orders, setOrders] = useState(recentOrders || []);
    const [liveStats, setLiveStats] = useState(stats || {});
    const [dailySeries, setDailySeries] = useState(dailySales || []);
    const [trendSeries, setTrendSeries] = useState(salesTrends || {});
    const [attendanceSeries, setAttendanceSeries] = useState(teamAttendance || []);
    const [stockSeries, setStockSeries] = useState(stockByShop || []);
    const [transferSeries, setTransferSeries] = useState(transferTrend || []);
    const [closeStatusSeries, setCloseStatusSeries] = useState(managerCloseStatus || []);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState(() => new Date());
    const [period, setPeriod] = useState("daily");
    const [attendancePage, setAttendancePage] = useState(1);
    const [closeStatusPage, setCloseStatusPage] = useState(1);
    const pageSize = 6;

    useEffect(() => {
        setOrders(recentOrders || []);
        setLiveStats(stats || {});
        setDailySeries(dailySales || []);
        setTrendSeries(salesTrends || {});
        setAttendanceSeries(teamAttendance || []);
        setStockSeries(stockByShop || []);
        setTransferSeries(transferTrend || []);
        setCloseStatusSeries(managerCloseStatus || []);
        setAttendancePage(1);
        setCloseStatusPage(1);
        setLastSyncAt(new Date());
    }, [recentOrders, stats, dailySales, salesTrends, teamAttendance, stockByShop, transferTrend, managerCloseStatus]);

    useEffect(() => {
        if (!window.Echo) return;

        const channelName = role === "manager" && user?.shop_id
            ? `shop.${user.shop_id}.notifications`
            : "admin-notifications";
        const channel = channelName === "admin-notifications"
            ? window.Echo.channel(channelName)
            : window.Echo.private(channelName);

        channel.listen(".NewOrderPlaced", (e) => {
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
                window.Echo.leave(channelName);
            }
        };
    }, [role, user?.shop_id]);

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
                    "managerCloseStatus",
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
    const managerKpis = useMemo(() => {
        const total = closeStatusSeries.length;
        const submitted = closeStatusSeries.filter((row) => row.submitted).length;
        return {
            total,
            submitted,
            missing: Math.max(0, total - submitted),
        };
    }, [closeStatusSeries]);

    const attendancePages = Math.max(1, Math.ceil(attendanceSeries.length / pageSize));
    const closeStatusPages = Math.max(1, Math.ceil(closeStatusSeries.length / pageSize));
    const attendanceRows = attendanceSeries.slice((attendancePage - 1) * pageSize, attendancePage * pageSize);
    const closeStatusRows = closeStatusSeries.slice((closeStatusPage - 1) * pageSize, closeStatusPage * pageSize);

    return (
        <AdminLayout>
            <Head title="Super Admin Dashboard" />

            <div className="space-y-6 pb-8">
                <section className="rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-950/90 text-white shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
                    <div className="px-6 sm:px-8 py-6 sm:py-7 bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.35),_transparent_42%),radial-gradient(circle_at_left_center,_rgba(34,211,238,0.18),_transparent_45%)]">
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
                                <span className="inline-flex items-center gap-2">
                                    <LuChartLine className="h-6 w-6 text-orange-300" />
                                    Revenue Overview
                                </span>
                            </h1>

                            <div className="hidden xl:block justify-self-end text-xs uppercase tracking-widest text-slate-300 font-bold">
                                Realtime Chart
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                            <div className="xl:flex-1">
                                <div className="h-44 sm:h-52 rounded-2xl border border-white/15 bg-black/20 p-4 overflow-hidden">
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
                                <MetricPill label="Total Sales" value={`${liveStats.total_sales || 0} MMK`} icon={<LuBanknote className="h-4 w-4" />} />
                                <MetricPill label="Total Orders" value={liveStats.total_orders || 0} icon={<LuShoppingCart className="h-4 w-4" />} />
                                <MetricPill label="Checked In Staff" value={liveStats.checked_in_staff ?? 0} icon={<LuUserCheck className="h-4 w-4" />} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <StatCard label="Active Shops" value={liveStats.active_shops || 0} tone="sky" icon={<LuStore className="h-3.5 w-3.5" />} />
                    <StatCard label="System Users" value={liveStats.system_users || 0} tone="violet" icon={<LuUsers className="h-3.5 w-3.5" />} />
                    <StatCard label="Orders" value={liveStats.total_orders || 0} tone="emerald" icon={<LuShoppingCart className="h-3.5 w-3.5" />} />
                    <StatCard label="Low Stock Shops" value={stockSummary.filter((s) => Number(s.low_stock_variants || 0) > 0).length} tone="amber" icon={<LuTriangleAlert className="h-3.5 w-3.5" />} />
                    <StatCard label="Active Staff" value={`${liveStats.checked_in_staff ?? 0}/${attendanceSeries.length}`} tone="rose" icon={<LuUserCheck className="h-3.5 w-3.5" />} />
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Branches Reported Today" value={`${managerKpis.submitted}/${managerKpis.total}`} tone="emerald" icon={<LuClipboardList className="h-3.5 w-3.5" />} />
                    <StatCard label="Pending Daily Close" value={managerKpis.missing} tone="amber" icon={<LuClock3 className="h-3.5 w-3.5" />} />
                    <StatCard label="Managers Tracked" value={attendanceSeries.filter((row) => row.role === "manager").length} tone="violet" icon={<LuUsers className="h-3.5 w-3.5" />} />
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                            <div>
                                <h3 className="inline-flex items-center gap-2 font-black text-slate-900 dark:text-slate-100">
                                    <LuChartColumn className="h-4 w-4 text-cyan-500 dark:text-cyan-300" />
                                    Stock by Shop
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Realtime inventory balance per branch</p>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                    <span className={`h-2 w-2 rounded-full ${refreshing ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
                                    {refreshing ? "Syncing" : "Live"}
                                </span>
                                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                    {lastSyncAt.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4 p-5">
                            {stockSummary.length ? (
                                stockSummary.map((item, idx) => (
                                    <div key={`${item.shop}-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-700 dark:bg-slate-800/70">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{item.shop}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                Low stock: <span className="font-bold text-slate-700 dark:text-slate-200">{Number(item.low_stock_variants || 0)}</span>
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
                                            <div className="w-24 text-right text-sm font-black text-slate-800 dark:text-slate-100">
                                                {Number(item.total_stock || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500">No stock records yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                            <div>
                                <h3 className="inline-flex items-center gap-2 font-black text-slate-900 dark:text-slate-100">
                                    <LuArrowLeftRight className="h-4 w-4 text-violet-500 dark:text-violet-300" />
                                    Transfer Trend (7 days)
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Inter-shop stock sharing performance</p>
                            </div>
                            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Shared qty</span>
                        </div>
                        <div className="space-y-3.5 p-5">
                            {transferSummary.length ? (
                                transferSummary.map((item) => (
                                    <div key={item.date} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/70">
                                        <div className="w-24 text-xs text-slate-500 dark:text-slate-400">
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
                                        <div className="w-14 text-right text-sm font-black text-slate-800 dark:text-slate-100">
                                            {Number(item.qty || 0)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500">No transfer activity yet.</p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between border-b border-slate-50 p-5 dark:border-slate-700">
                        <h3 className="inline-flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                            <LuShoppingCart className="h-4 w-4 text-orange-500 dark:text-orange-300" />
                            Recent Orders
                        </h3>
                        <span className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Realtime feed</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-50 text-[11px] uppercase tracking-widest text-slate-400 dark:border-slate-700 dark:text-slate-500">
                                    <th className="px-5 py-3 font-bold">
                                        <span className="inline-flex items-center gap-1.5"><LuClipboardList className="h-3 w-3" />Order</span>
                                    </th>
                                    <th className="px-5 py-3 font-bold">
                                        <span className="inline-flex items-center gap-1.5"><LuUsers className="h-3 w-3" />Customer</span>
                                    </th>
                                    <th className="px-5 py-3 font-bold">
                                        <span className="inline-flex items-center gap-1.5"><LuStore className="h-3 w-3" />Shop</span>
                                    </th>
                                    <th className="px-5 py-3 font-bold">
                                        <span className="inline-flex items-center gap-1.5"><LuBanknote className="h-3 w-3" />Amount</span>
                                    </th>
                                    <th className="px-5 py-3 font-bold">
                                        <span className="inline-flex items-center gap-1.5"><LuClock3 className="h-3 w-3" />Status</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {orders.length ? (
                                    orders.map((order) => {
                                        const statusKey = String(order.status || "pending").toLowerCase();
                                        const tone = ORDER_STATUS_TONES[statusKey] || "bg-slate-100 text-slate-700";
                                        return (
                                            <tr key={order.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                                                <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100">#{order.id}</td>
                                                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{order.user?.name || "Customer not set"}</td>
                                                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{order.shop?.name || "Shop not assigned"}</td>
                                                <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-100">
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
                                        <td colSpan="5" className="p-10 text-center text-slate-400 dark:text-slate-500">
                                            No orders available yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70">
                        <div className="border-b border-slate-100 p-5 dark:border-slate-700">
                            <h3 className="inline-flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                                <LuUserCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
                                Team Active Status
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Super Admin can quickly monitor who is on shift now.</p>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {attendanceRows.length ? (
                                attendanceRows.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between gap-3 px-5 py-3">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{member.name}</p>
                                            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                                                {member.role || "staff"} {member.shop ? `• ${member.shop}` : ""}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${member.checked_in ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                            {member.checked_in ? "active now" : "offline"}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-5 py-8 text-sm text-slate-400 dark:text-slate-500">No staff attendance data.</div>
                            )}
                        </div>
                        <SimplePager current={attendancePage} total={attendancePages} onChange={setAttendancePage} />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70">
                        <div className="border-b border-slate-100 p-5 dark:border-slate-700">
                            <h3 className="inline-flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                                <LuClipboardList className="h-4 w-4 text-sky-500 dark:text-sky-300" />
                                Daily Close Submission Status
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manager reports by branch for today.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:text-slate-500">
                                        <th className="px-5 py-3">
                                            <span className="inline-flex items-center gap-1.5"><LuStore className="h-3 w-3" />Branch</span>
                                        </th>
                                        <th className="px-5 py-3">
                                            <span className="inline-flex items-center gap-1.5"><LuShoppingCart className="h-3 w-3" />Orders</span>
                                        </th>
                                        <th className="px-5 py-3">
                                            <span className="inline-flex items-center gap-1.5"><LuBanknote className="h-3 w-3" />Net</span>
                                        </th>
                                        <th className="px-5 py-3">
                                            <span className="inline-flex items-center gap-1.5"><LuClock3 className="h-3 w-3" />Status</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {closeStatusRows.length ? (
                                        closeStatusRows.map((row) => (
                                            <tr key={row.shop_id}>
                                                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">{row.shop}</td>
                                                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{row.orders_count}</td>
                                                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{Number(row.net_amount || 0).toLocaleString()} MMK</td>
                                                <td className="px-5 py-3">
                                                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${row.submitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                        {row.submitted ? "submitted" : "pending"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">No branch close status.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <SimplePager current={closeStatusPage} total={closeStatusPages} onChange={setCloseStatusPage} />
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

function SimplePager({ current, total, onChange }) {
    if (total <= 1) return null;
    return (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-700">
            <button
                type="button"
                onClick={() => onChange(Math.max(1, current - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                disabled={current <= 1}
            >
                <span className="inline-flex items-center gap-1">
                    <LuChevronLeft className="h-3 w-3" />
                    Previous
                </span>
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">Page {current} / {total}</span>
            <button
                type="button"
                onClick={() => onChange(Math.min(total, current + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                disabled={current >= total}
            >
                <span className="inline-flex items-center gap-1">
                    Next
                    <LuChevronRight className="h-3 w-3" />
                </span>
            </button>
        </div>
    );
}

function StatCard({ label, value, tone = "sky", icon = null }) {
    const tones = {
        sky: {
            bar: "from-sky-500 via-cyan-400 to-blue-500",
            card: "from-sky-50 to-cyan-50",
            darkCard: "dark:from-sky-500/10 dark:to-cyan-500/5",
            dot: "bg-cyan-500",
        },
        violet: {
            bar: "from-violet-500 via-fuchsia-400 to-pink-500",
            card: "from-violet-50 to-fuchsia-50",
            darkCard: "dark:from-violet-500/10 dark:to-fuchsia-500/5",
            dot: "bg-fuchsia-500",
        },
        emerald: {
            bar: "from-emerald-500 via-teal-400 to-lime-500",
            card: "from-emerald-50 to-lime-50",
            darkCard: "dark:from-emerald-500/10 dark:to-lime-500/5",
            dot: "bg-emerald-500",
        },
        amber: {
            bar: "from-amber-500 via-orange-500 to-rose-500",
            card: "from-amber-50 to-orange-50",
            darkCard: "dark:from-amber-500/12 dark:to-orange-500/5",
            dot: "bg-amber-500",
        },
        rose: {
            bar: "from-rose-500 via-pink-500 to-orange-500",
            card: "from-rose-50 to-pink-50",
            darkCard: "dark:from-rose-500/10 dark:to-pink-500/5",
            dot: "bg-rose-500",
        },
    };
    const style = tones[tone] || tones.sky;

    return (
        <div className={`rounded-2xl border border-slate-200/70 bg-gradient-to-br ${style.card} p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-slate-700/70 dark:from-slate-900/70 dark:to-slate-900/50 ${style.darkCard}`}>
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
                <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    {icon ? <span>{icon}</span> : null}
                    <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`}></span>
                </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</p>
                <div className={`h-2 w-14 rounded-full bg-gradient-to-r ${style.bar}`}></div>
            </div>
        </div>
    );
}

function MetricPill({ label, value, icon = null }) {
    return (
        <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-300 font-bold">
                {icon ? <span className="text-orange-300">{icon}</span> : null}
                {label}
            </p>
            <p className="mt-1 text-lg font-black text-white">{value}</p>
        </div>
    );
}
