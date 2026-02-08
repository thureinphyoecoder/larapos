import { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function AdminLayout({ children, header }) {
    const page = usePage();
    const { auth, attendance, flash } = page.props;
    const user = auth?.user;
    const role = auth?.role || "admin";
    const canTrackAttendance = ["admin", "manager", "sales", "delivery"].includes(role);
    const canUseSearch = ["admin", "manager", "sales"].includes(role);
    const roleLabelMap = {
        admin: "Super Admin",
        manager: "Manager",
        sales: "Sales Staff",
        delivery: "Rider",
    };
    const primaryIdentity = user?.name || "Unknown User";
    const normalizedRole = (roleLabelMap[role] || "Admin Account").toLowerCase().trim();
    const normalizedName = String(primaryIdentity).toLowerCase().trim();
    const secondaryIdentity = normalizedName === normalizedRole
        ? (user?.email || "System Account")
        : (roleLabelMap[role] || "Admin Account");

    const menuByRole = {
        admin: [
            { label: "Dashboard", route: "admin.dashboard", activePatterns: ["admin.dashboard"] },
            { label: "Inventory", route: "admin.inventory.index", activePatterns: ["admin.inventory.*"] },
            { label: "Support", route: "admin.support.index", activePatterns: ["admin.support.*"] },
            { label: "Orders", route: "admin.orders.index", activePatterns: ["admin.orders.*"] },
            { label: "Products", route: "admin.products.index", activePatterns: ["admin.products.*"] },
            { label: "Categories", route: "admin.categories.index", activePatterns: ["admin.categories.*"] },
            { label: "Shops", route: "admin.shops.index", activePatterns: ["admin.shops.*"] },
            { label: "Users", route: "admin.users.index", activePatterns: ["admin.users.*"] },
        ],
        manager: [
            { label: "Dashboard", route: "admin.dashboard", activePatterns: ["admin.dashboard"] },
            { label: "Inventory", route: "admin.inventory.index", activePatterns: ["admin.inventory.*"] },
            { label: "Support", route: "admin.support.index", activePatterns: ["admin.support.*"] },
            { label: "Orders", route: "admin.orders.index", activePatterns: ["admin.orders.*"] },
            { label: "Products", route: "admin.products.index", activePatterns: ["admin.products.*"] },
            { label: "Categories", route: "admin.categories.index", activePatterns: ["admin.categories.*"] },
        ],
        sales: [
            { label: "Dashboard", route: "admin.dashboard", activePatterns: ["admin.dashboard"] },
            { label: "Inventory", route: "admin.inventory.index", activePatterns: ["admin.inventory.*"] },
            { label: "Support", route: "admin.support.index", activePatterns: ["admin.support.*"] },
            { label: "Orders", route: "admin.orders.index", activePatterns: ["admin.orders.*"] },
            { label: "Products", route: "admin.products.index", activePatterns: ["admin.products.*"] },
        ],
        delivery: [
            { label: "Rider Dashboard", route: "admin.dashboard", activePatterns: ["admin.dashboard"] },
            { label: "Delivery Orders", route: "admin.orders.index", activePatterns: ["admin.orders.*"] },
        ],
    };

    const navLinks = menuByRole[role] || menuByRole.admin;
    const canAccessSupport = ["admin", "manager", "sales"].includes(role);
    const toMinutes = (value) => Math.max(0, Math.round(Number(value || 0)));
    const formatWorkedTime = (value) => {
        const minutes = toMinutes(value);
        const hours = Math.floor(minutes / 60);
        const remain = minutes % 60;
        return `${hours}h ${remain}m`;
    };

    // Notification State
    const [showNoti, setShowNoti] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [globalSearch, setGlobalSearch] = useState("");
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const notificationStorageKey = user?.id
        ? `larapos_admin_notifications_${user.id}_${role}`
        : null;

    const markNotificationAsRead = (notificationId) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
        );
    };

    const openNotification = (notification) => {
        markNotificationAsRead(notification.id);
        setShowNoti(false);

        if (notification.url) {
            router.get(notification.url);
        }
    };

    useEffect(() => {
        if (!notificationStorageKey) {
            setNotifications([]);
            return;
        }

        try {
            const raw = window.localStorage.getItem(notificationStorageKey);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                setNotifications(parsed);
            }
        } catch {
            setNotifications([]);
        }
    }, [notificationStorageKey]);

    useEffect(() => {
        if (!notificationStorageKey) return;
        window.localStorage.setItem(
            notificationStorageKey,
            JSON.stringify(notifications.slice(0, 80)),
        );
    }, [notifications, notificationStorageKey]);

    useEffect(() => {
        if (window.Echo) {
            window.Echo.channel("admin-notifications").listen(
                ".NewOrderPlaced",
                (e) => {
                    const next = {
                        id: `order-${e.id}-${Date.now()}`,
                        type: "order",
                        message: e.message,
                        time: e.time,
                        isRead: false,
                        url: route("admin.orders.show", e.id),
                    };
                    setNotifications((prev) => [next, ...prev].slice(0, 80));
                },
            );

            window.Echo.channel("admin-notifications").listen(
                ".SupportMessageSent",
                (e) => {
                    // Staff side: notify only when customer sent a message.
                    if (Number(e.sender_id) !== Number(e.customer_id)) {
                        return;
                    }

                    const next = {
                        id: `support-${e.id}`,
                        type: "support",
                        message: `Support: ${e.sender_name || "Customer"} - ${e.message}`,
                        time: "just now",
                        isRead: false,
                        url: route("admin.support.index", { customer: e.customer_id }),
                    };
                    setNotifications((prev) => [next, ...prev].slice(0, 80));
                },
            );
        }

        return () => {
            if (window.Echo) {
                window.Echo.leaveChannel("admin-notifications");
            }
        };
    }, []);

    useEffect(() => {
        const handleSupportSeen = () => {
            setNotifications((prev) =>
                prev.map((n) =>
                    String(n.id).startsWith("support-")
                        ? { ...n, isRead: true }
                        : n,
                ),
            );
        };

        window.addEventListener("support:clear-notifications", handleSupportSeen);

        return () => {
            window.removeEventListener("support:clear-notifications", handleSupportSeen);
        };
    }, []);

    useEffect(() => {
        if (!flash?.success && !flash?.error) {
            return;
        }

        Swal.fire({
            toast: true,
            position: "top-end",
            timer: 2200,
            showConfirmButton: false,
            icon: flash?.success ? "success" : "error",
            title: flash?.success || flash?.error || "",
        });
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const q = params.get("q") || "";
            setGlobalSearch(q);
        } catch {
            setGlobalSearch("");
        }
    }, [page.url]);

    const submitAttendance = (type) => {
        const routeName = type === "out" ? "staff.checkout" : "staff.checkin";
        router.post(
            route(routeName),
            {},
            {
                preserveScroll: true,
                onStart: () => setAttendanceLoading(true),
                onFinish: () => setAttendanceLoading(false),
            },
        );
    };

    const isLinkActive = (link) => {
        const patterns = link.activePatterns?.length
            ? link.activePatterns
            : [link.route];
        return patterns.some((pattern) => route().current(pattern));
    };

    return (
        <div
            className="min-h-screen bg-slate-100/80 flex"
            style={{ fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif' }}
        >
            {/* Sidebar */}
            <aside className="w-64 bg-slate-950 text-slate-100 hidden md:flex flex-col fixed h-full border-r border-slate-800 shadow-xl">
                <div className="p-6 border-b border-slate-800">
                    <Link
                        href="/"
                        className="text-2xl font-black tracking-tight text-orange-400"
                    >
                        LaraPee Admin
                    </Link>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-[0.2em]">
                        {role === "delivery" ? "rider panel" : `${role} panel`}
                    </p>
                </div>

                <nav className="flex-1 px-4 py-5 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.route}
                            href={route(link.route)}
                            className={`block px-3 py-2.5 rounded-xl text-sm font-bold transition ${
                                isLinkActive(link)
                                    ? "bg-orange-500/15 text-orange-300 border border-orange-500/30"
                                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <p className="text-sm font-semibold text-slate-100 truncate">
                        {primaryIdentity}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider truncate">
                        {secondaryIdentity}
                    </p>
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="mt-3 w-full rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-300 hover:bg-rose-500/20"
                    >
                        Log out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ms-64 flex flex-col min-h-screen">
                <header className="h-20 bg-white/90 backdrop-blur border-b border-slate-200 px-6 sticky top-0 z-50">
                    <div className="h-full grid grid-cols-[auto,1fr,auto] items-center gap-6">
                        <div className="text-lg font-black text-slate-900 whitespace-nowrap">
                            {header || "Admin"}
                        </div>

                        <div className="flex justify-center">
                            {canUseSearch && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        router.get(route("admin.search.index"), { q: globalSearch || undefined });
                                    }}
                                    className="hidden xl:block w-[42rem] max-w-full"
                                >
                                    <div className="relative">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-4.35-4.35m1.6-4.15a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
                                            />
                                        </svg>
                                        <input
                                            type="text"
                                            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 ps-11 pe-4 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm transition focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                                            placeholder="Search products, SKU, order ID, phone, customer..."
                                            value={globalSearch}
                                            onChange={(e) => setGlobalSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Escape") {
                                                    setGlobalSearch("");
                                                }
                                            }}
                                        />
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="flex items-center gap-6 justify-self-end">
                        {canTrackAttendance && (
                            <div className="hidden lg:flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1 bg-white shadow-sm">
                                {attendance?.is_checked_in ? (
                                    <button
                                        onClick={() => submitAttendance("out")}
                                        disabled={attendanceLoading}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {attendanceLoading ? "Saving..." : "End Shift"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => submitAttendance("in")}
                                        disabled={attendanceLoading}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {attendanceLoading ? "Saving..." : "Start Shift"}
                                    </button>
                                )}
                                <span className="text-[11px] font-semibold text-slate-500">
                                    {attendance?.is_checked_in
                                        ? `On shift ${formatWorkedTime(attendance?.active_minutes)}`
                                        : `Today worked ${formatWorkedTime(attendance?.today_worked_minutes)}`}
                                </span>
                            </div>
                        )}

                        {canAccessSupport && (
                            <Link
                                href={route("admin.support.index")}
                                className="hidden sm:inline-flex px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200 text-slate-600 hover:bg-slate-100"
                            >
                                Support Inbox
                            </Link>
                        )}

                        {/* 🔔 Notification Icon Section */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNoti(!showNoti)}
                                className="p-2 text-slate-500 hover:text-orange-600 transition rounded-full hover:bg-slate-100 focus:outline-none"
                            >
                                {/* ခေါင်းလောင်း Icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>

                                {/* 🎯 နံပါတ် Badge - ခေါင်းလောင်းပေါ်မှာ ကပ်ဖို့ absolute နဲ့ translate သုံးထားတယ် */}
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-5 w-5 transform translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-white">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {showNoti && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowNoti(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                                            <span className="font-bold text-slate-700">
                                                Notifications
                                            </span>
                                            <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">
                                                Recent
                                            </span>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map((n) => (
                                                    <button
                                                        key={n.id}
                                                        type="button"
                                                        onClick={() => openNotification(n)}
                                                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer ${!n.isRead ? "bg-blue-50/30" : ""}`}
                                                    >
                                                        <p className="text-sm text-slate-700 leading-snug">
                                                            {n.message}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mt-1">
                                                            {n.time}
                                                        </p>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-slate-400 text-sm">
                                                    Notification မရှိသေးပါ
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNotifications([])}
                                            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-orange-600 transition bg-slate-50/50 uppercase tracking-widest"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-8">{children}</main>
            </div>
        </div>
    );
}
