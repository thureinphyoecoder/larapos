import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import LocaleSwitcher from "@/Components/LocaleSwitcher";
import NavLink from "@/Components/NavLink";
import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function AuthenticatedLayout({ header, children }) {
    const { props } = usePage();
    const auth = props.auth;
    const user = auth?.user;
    const currentUserRole = auth?.role || "user";

    const [showNoti, setShowNoti] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [, setTimeTick] = useState(0);
    const normalizeTimestamp = (value) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
    };
    const containDropdownScroll = (event) => {
        const el = event.currentTarget;
        const atTop = el.scrollTop <= 0;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
        const scrollingDown = event.deltaY > 0;
        const scrollingUp = event.deltaY < 0;

        if ((atTop && scrollingUp) || (atBottom && scrollingDown)) {
            event.preventDefault();
        }
        event.stopPropagation();
    };
    const formatRelativeTime = (value) => {
        if (!value) return "just now";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        const diffMs = date.getTime() - Date.now();
        const absMs = Math.abs(diffMs);
        const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
        if (absMs < 60 * 1000) return rtf.format(Math.round(diffMs / 1000), "second");
        if (absMs < 60 * 60 * 1000) return rtf.format(Math.round(diffMs / (60 * 1000)), "minute");
        if (absMs < 24 * 60 * 60 * 1000) return rtf.format(Math.round(diffMs / (60 * 60 * 1000)), "hour");
        return rtf.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), "day");
    };
    const notificationStorageKey = user?.id
        ? `larapos_user_notifications_${user.id}`
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
                const migrated = parsed
                    .map((n) => ({
                        ...n,
                        createdAt: normalizeTimestamp(n.createdAt || n.created_at || null),
                    }))
                    .filter((n) => n.createdAt);

                setNotifications(
                    migrated,
                );

                if (migrated.length !== parsed.length) {
                    window.localStorage.setItem(notificationStorageKey, JSON.stringify(migrated.slice(0, 80)));
                }
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
        const timer = window.setInterval(() => {
            setTimeTick((prev) => prev + 1);
        }, 30000);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (!window.Echo || !user?.id) return;

        const channel = `user.${user.id}`;
        window.Echo.private(channel).listen(".OrderStatusUpdated", (e) => {
            const next = {
                id: `${e.id}-${Date.now()}`,
                message: e.message || "Order status updated",
                createdAt: new Date().toISOString(),
                isRead: false,
                url: route("orders.show", e.id),
            };
            setNotifications((prev) => [next, ...prev].slice(0, 80));
            Swal.fire({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 4000,
                icon: "success",
                title: e.message || "Order status updated",
            });
        });

        window.Echo.private(channel).listen(".SupportMessageSent", (e) => {
            if (Number(e.sender_id) === Number(user?.id)) {
                return;
            }

            // Customer side: notify only for real staff replies (not bot/system echoes).
            if (Number(e.sender_id) !== Number(e.staff_id)) {
                return;
            }

            const next = {
                id: `support-${e.id}-${Date.now()}`,
                message: `Support: ${e.message || "New message"}`,
                createdAt: e.created_at || new Date().toISOString(),
                isRead: false,
                url: route("support.index"),
            };
            setNotifications((prev) => [next, ...prev].slice(0, 80));
            Swal.fire({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 4500,
                icon: "info",
                title: `Support reply: ${e.sender_name || "Team"}`,
                text: e.message || "",
            });
        });

        return () => {
            window.Echo.leaveChannel(channel);
        };
    }, [user?.id]);

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

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Role အလိုက် Menu Configuration (SOLID: Data and UI logic Separation)
    const sideMenu = {
        admin: [
            { label: "📊 Dashboard", route: "admin.dashboard" },
            { label: "🧾 Orders", route: "admin.orders.index" },
            { label: "📦 Products", route: "admin.products.index" },
        ],
        manager: [
            { label: "📊 Dashboard", route: "admin.dashboard" },
            { label: "🧾 Orders", route: "admin.orders.index" },
            { label: "📦 Inventory", route: "admin.products.index" },
        ],
        sales: [
            { label: "📊 Dashboard", route: "admin.dashboard" },
            { label: "🧾 Orders", route: "admin.orders.index" },
        ],
        delivery: [
            { label: "📍 Dashboard", route: "dashboard" },
            { label: "🚚 My Deliveries", route: "admin.orders.index" },
        ],
        user: [
            { label: "🏠 Dashboard", route: "dashboard" },
            { label: "🧾 My Orders", route: "orders.index" },
            { label: "💬 Support Chat", route: "support.index" },
            { label: "👤 Profile", route: "profile.edit" },
        ],
    };

    const links = sideMenu[currentUserRole] || [];
    const isUser = currentUserRole === "user";

    return (
        <div className={`min-h-screen bg-gray-100 ${isUser ? "" : "flex"}`}>
            {/* Desktop Sidebar (admin/staff only) */}
            {!isUser && (
                <aside className="w-64 bg-white shadow-xl hidden md:flex flex-col fixed h-full">
                    <div className="p-6 border-b border-gray-100">
                        <Link href="/">
                            <ApplicationLogo className="h-9 w-auto fill-current text-orange-600" />
                        </Link>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">
                            {currentUserRole} Panel
                        </p>
                        {links.map((link, index) => (
                            <NavLink
                                key={index}
                                href={route(link.route)}
                                active={route().current(link.route)}
                                className="w-full flex items-center px-3 py-2 text-sm font-medium transition-colors duration-150"
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 truncate">
                            {user?.name ? user.name : "Still Guest?"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {user?.name ? user.name : "Still Guest?"}
                        </p>
                    </div>
                </aside>
            )}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col ${isUser ? "" : "md:ms-64"}`}>
                <nav className="bg-white border-b border-gray-100 h-16 flex items-center px-6 sm:px-8 sticky top-0 z-10 gap-4">
                    <div className="flex-1 flex items-center gap-3">
                        {isUser && (
                            <Link href="/">
                                <ApplicationLogo className="h-8 w-auto fill-current text-orange-600" />
                            </Link>
                        )}

                        {isUser && (
                            <div className="flex items-center gap-2 ms-2 overflow-x-auto whitespace-nowrap">
                                {links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={route(link.route)}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                                            route().current(link.route)
                                                ? "bg-orange-600 text-white border-orange-600"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notification Icon */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNoti(!showNoti)}
                            className="p-2 text-gray-500 hover:text-orange-600 transition rounded-full hover:bg-gray-100"
                        >
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
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-5 w-5 transform translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-white">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNoti && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowNoti(false)}
                                ></div>
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 overflow-hidden">
                                    <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                                        <span className="font-bold text-slate-700">
                                            Notifications
                                        </span>
                                        <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">
                                            Recent
                                        </span>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto overscroll-contain" onWheel={containDropdownScroll}>
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <button
                                                    key={n.id}
                                                    type="button"
                                                    onClick={() => openNotification(n)}
                                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 ${!n.isRead ? "bg-orange-50/40" : ""}`}
                                                >
                                                    <p className="text-sm text-slate-700 leading-snug">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-1">
                                                        {formatRelativeTime(n.createdAt)}
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

                    <LocaleSwitcher compact />

                    <div className="relative">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none transition duration-150">
                                    Profile Settings
                                    <svg
                                        className="ms-2 h-4 w-4"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route("profile.edit")}>
                                    Profile
                                </Dropdown.Link>
                                <Dropdown.Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                >
                                    Log Out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </nav>

                {header && (
                    <header className="bg-white shadow-sm">
                        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main className={`flex-1 ${isUser ? "p-4 sm:p-6" : "p-6"}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
