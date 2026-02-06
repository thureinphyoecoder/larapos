import { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";

export default function AdminLayout({ children, header }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const role = auth?.role || "admin";

    const navLinks = [
        { label: "Dashboard", route: "admin.dashboard" },
        { label: "Orders", route: "admin.orders.index" },
        { label: "Products", route: "admin.products.index" },
        { label: "Categories", route: "admin.categories.index" },
        { label: "Shops", route: "admin.shops.index" },
        { label: "Users", route: "admin.users.index" },
    ];

    // Notification State
    const [showNoti, setShowNoti] = useState(false);
    const [notifications, setNotifications] = useState([]);

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
        }

        return () => {
            if (window.Echo) {
                window.Echo.leaveChannel("admin-notifications");
            }
        };
    }, []);

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
                    <div className="text-sm font-semibold text-slate-700">
                        {header || "Admin"}
                    </div>

                    <div className="flex items-center gap-6">
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
