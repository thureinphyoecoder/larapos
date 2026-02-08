import { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function AdminLayout({ children, header }) {
    const { auth, attendance, flash } = usePage().props;
    const user = auth?.user;
    const role = auth?.role || "admin";
    const canTrackAttendance = ["admin", "manager", "sales", "delivery"].includes(role);

    const menuByRole = {
        admin: [
            { label: "Dashboard", route: "admin.dashboard" },
            { label: "Inventory", route: "admin.inventory.index" },
            { label: "Support", route: "admin.support.index" },
            { label: "Orders", route: "admin.orders.index" },
            { label: "Products", route: "admin.products.index" },
            { label: "Categories", route: "admin.categories.index" },
            { label: "Shops", route: "admin.shops.index" },
            { label: "Users", route: "admin.users.index" },
        ],
        manager: [
            { label: "Dashboard", route: "admin.dashboard" },
            { label: "Inventory", route: "admin.inventory.index" },
            { label: "Support", route: "admin.support.index" },
            { label: "Orders", route: "admin.orders.index" },
            { label: "Products", route: "admin.products.index" },
            { label: "Categories", route: "admin.categories.index" },
        ],
        sales: [
            { label: "Dashboard", route: "admin.dashboard" },
            { label: "Inventory", route: "admin.inventory.index" },
            { label: "Support", route: "admin.support.index" },
            { label: "Orders", route: "admin.orders.index" },
            { label: "Products", route: "admin.products.index" },
        ],
        delivery: [
            { label: "Dashboard", route: "dashboard" },
            { label: "Orders", route: "admin.orders.index" },
        ],
    };

    const navLinks = menuByRole[role] || menuByRole.admin;
    const canAccessSupport = ["admin", "manager", "sales"].includes(role);

    // Notification State
    const [showNoti, setShowNoti] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [globalSearch, setGlobalSearch] = useState("");
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    useEffect(() => {
        if (window.Echo) {
            window.Echo.channel("admin-notifications").listen(
                ".NewOrderPlaced",
                (e) => {
                    const next = {
                        id: e.id,
                        message: e.message,
                        time: e.time,
                        isRead: false,
                    };
                    setNotifications((prev) => [next, ...prev]);
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
                        message: `Support: ${e.sender_name || "Customer"} - ${e.message}`,
                        time: "just now",
                        isRead: false,
                    };
                    setNotifications((prev) => [next, ...prev]);
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

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col fixed h-full">
                <div className="p-6 border-b border-slate-100">
                    <Link
                        href="/"
                        className="text-xl font-black text-orange-600"
                    >
                        LaraPee Admin
                    </Link>
                    <p className="text-xs text-slate-400 mt-1 capitalize">
                        {role} panel
                    </p>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.route}
                            href={route(link.route)}
                            className={`block px-3 py-2 rounded-lg text-sm font-semibold transition ${
                                route().current(link.route)
                                    ? "bg-orange-50 text-orange-600"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                        {user?.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                        {user?.email || ""}
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ms-64 flex flex-col min-h-screen">
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-semibold text-slate-700">
                            {header || "Admin"}
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                router.get(route("admin.search.index"), { q: globalSearch || undefined });
                            }}
                            className="hidden xl:flex items-center"
                        >
                            <input
                                type="text"
                                className="w-80 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                                placeholder="Global search: product, variant SKU, order, user..."
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                            />
                        </form>
                    </div>

                    <div className="flex items-center gap-6">
                        {canTrackAttendance && (
                            <div className="hidden lg:flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1 bg-slate-50">
                                {attendance?.is_checked_in ? (
                                    <button
                                        onClick={() => submitAttendance("out")}
                                        disabled={attendanceLoading}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {attendanceLoading ? "Working..." : "Check Out"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => submitAttendance("in")}
                                        disabled={attendanceLoading}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {attendanceLoading ? "Working..." : "Check In"}
                                    </button>
                                )}
                                <span className="text-[11px] font-semibold text-slate-500">
                                    {attendance?.is_checked_in
                                        ? `Active ${Math.floor((attendance?.active_minutes || 0) / 60)}h ${(attendance?.active_minutes || 0) % 60}m`
                                        : `Today ${Math.floor((attendance?.today_worked_minutes || 0) / 60)}h ${(attendance?.today_worked_minutes || 0) % 60}m`}
                                </span>
                            </div>
                        )}

                        {canAccessSupport && (
                            <Link
                                href={route("admin.support.index")}
                                className="hidden sm:inline-flex px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200 text-slate-600 hover:bg-slate-50"
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
                                                    <div
                                                        key={n.id}
                                                        className={`px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer ${!n.isRead ? "bg-blue-50/30" : ""}`}
                                                    >
                                                        <p className="text-sm text-slate-700 leading-snug">
                                                            {n.message}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mt-1">
                                                            {n.time}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-slate-400 text-sm">
                                                    Notification မရှိသေးပါ
                                                </div>
                                            )}
                                        </div>
                                        <button className="w-full py-2 text-xs font-bold text-slate-400 hover:text-orange-600 transition bg-slate-50/50 uppercase tracking-widest">
                                            Clear All
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Logout Section */}
                        <div className="flex items-center gap-3 border-l border-slate-100 ps-6">
                            <span className="text-sm font-bold text-slate-600">
                                {user?.name || ""}
                            </span>
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-600 transition"
                            >
                                Log out
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
