import { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import LocaleSwitcher from "@/Components/LocaleSwitcher";
import {
    LuBell,
    LuBoxes,
    LuChartColumn,
    LuChevronDown,
    LuClipboardList,
    LuFileClock,
    LuHeadset,
    LuLayoutDashboard,
    LuPackage,
    LuReceiptText,
    LuSearch,
    LuShieldCheck,
    LuStore,
    LuUsers,
    LuWallet,
} from "react-icons/lu";
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
        accountant: "Accountant",
    };
    const primaryIdentity = user?.name || "Unknown User";
    const normalizedRole = (roleLabelMap[role] || "Admin Account").toLowerCase().trim();
    const normalizedName = String(primaryIdentity).toLowerCase().trim();
    const secondaryIdentity = normalizedName === normalizedRole
        ? (user?.email || "System Account")
        : (roleLabelMap[role] || "Admin Account");

    const menuByRole = {
        admin: [
            {
                id: "overview",
                label: "Overview",
                links: [
                    { label: "Dashboard", route: "admin.dashboard", activePatterns: ["admin.dashboard"] },
                ],
            },
            {
                id: "operations",
                label: "Operations",
                links: [
                    { label: "Orders", route: "admin.orders.index", activePatterns: ["admin.orders.*"] },
                    { label: "Support", route: "admin.support.index", activePatterns: ["admin.support.*"] },
                    { label: "Service Jobs", route: "admin.service-jobs.index", activePatterns: ["admin.service-jobs.*"] },
                ],
            },
            {
                id: "catalog",
                label: "Catalog",
                links: [
                    { label: "Products", route: "admin.products.index", activePatterns: ["admin.products.*"] },
                    { label: "Categories", route: "admin.categories.index", activePatterns: ["admin.categories.*"] },
                    { label: "Inventory", route: "admin.inventory.index", activePatterns: ["admin.inventory.*"] },
                    { label: "Stock Logs", route: "admin.stock-movements.index", activePatterns: ["admin.stock-movements.*"] },
                ],
            },
            {
                id: "finance",
                label: "Finance & HR",
                links: [
                    { label: "Payments", route: "admin.payments.index", activePatterns: ["admin.payments.*"] },
                    { label: "Payroll", route: "admin.payroll.index", activePatterns: ["admin.payroll.*"] },
                ],
            },
            {
                id: "admin",
                label: "Admin",
                links: [
                    { label: "Audit Logs", route: "admin.audit-logs.index", activePatterns: ["admin.audit-logs.*"] },
                    { label: "Shops", route: "admin.shops.index", activePatterns: ["admin.shops.*"] },
                    { label: "Users", route: "admin.users.index", activePatterns: ["admin.users.*"] },
                ],
            },
        ],
        manager: [
            {
                id: "overview",
                label: "Overview",
                links: [
                    { label: "Dashboard", route: "admin.dashboard", activePatterns: ["admin.dashboard"] },
                ],
            },
            {
                id: "operations",
                label: "Operations",
                links: [
                    { label: "Orders", route: "admin.orders.index", activePatterns: ["admin.orders.*"] },
                    { label: "Support", route: "admin.support.index", activePatterns: ["admin.support.*"] },
                    { label: "Service Jobs", route: "admin.service-jobs.index", activePatterns: ["admin.service-jobs.*"] },
                ],
            },
            {
                id: "catalog",
                label: "Catalog",
                links: [
                    { label: "Products", route: "admin.products.index", activePatterns: ["admin.products.*"] },
                    { label: "Categories", route: "admin.categories.index", activePatterns: ["admin.categories.*"] },
                    { label: "Inventory", route: "admin.inventory.index", activePatterns: ["admin.inventory.*"] },
                    { label: "Stock Logs", route: "admin.stock-movements.index", activePatterns: ["admin.stock-movements.*"] },
                ],
            },
            {
                id: "finance",
                label: "Finance",
                links: [
                    { label: "Payments", route: "admin.payments.index", activePatterns: ["admin.payments.*"] },
                    { label: "Audit Logs", route: "admin.audit-logs.index", activePatterns: ["admin.audit-logs.*"] },
                ],
            },
        ],
        accountant: [
            {
                id: "finance",
                label: "Finance & Compliance",
                links: [
                    { label: "Payroll", route: "admin.payroll.index", activePatterns: ["admin.payroll.*"] },
                    { label: "Payments", route: "admin.payments.index", activePatterns: ["admin.payments.*"] },
                    { label: "Orders", route: "admin.orders.index", activePatterns: ["admin.orders.*"] },
                    { label: "Stock Logs", route: "admin.stock-movements.index", activePatterns: ["admin.stock-movements.*"] },
                    { label: "Audit Logs", route: "admin.audit-logs.index", activePatterns: ["admin.audit-logs.*"] },
                    { label: "Service Jobs", route: "admin.service-jobs.index", activePatterns: ["admin.service-jobs.*"] },
                ],
            },
        ],
        sales: [
            {
                id: "overview",
                label: "Overview",
                links: [
                    { label: "Dashboard", route: "admin.dashboard", activePatterns: ["admin.dashboard"] },
                ],
            },
            {
                id: "frontdesk",
                label: "Front Desk",
                links: [
                    { label: "Orders", route: "admin.orders.index", activePatterns: ["admin.orders.*"] },
                    { label: "Support", route: "admin.support.index", activePatterns: ["admin.support.*"] },
                    { label: "Products", route: "admin.products.index", activePatterns: ["admin.products.*"] },
                    { label: "Inventory", route: "admin.inventory.index", activePatterns: ["admin.inventory.*"] },
                ],
            },
        ],
        delivery: [
            {
                id: "delivery",
                label: "Delivery Panel",
                links: [
                    { label: "Rider Dashboard", route: "admin.dashboard", activePatterns: ["admin.dashboard"] },
                    { label: "Delivery Orders", route: "admin.orders.index", activePatterns: ["admin.orders.*"] },
                ],
            },
        ],
    };

    const navGroups = menuByRole[role] || menuByRole.admin;
    const menuIconByLabel = {
        Dashboard: LuLayoutDashboard,
        Orders: LuClipboardList,
        Support: LuHeadset,
        "Service Jobs": LuFileClock,
        Products: LuPackage,
        Categories: LuBoxes,
        Inventory: LuBoxes,
        "Stock Logs": LuChartColumn,
        Payments: LuWallet,
        Payroll: LuReceiptText,
        "Audit Logs": LuShieldCheck,
        Shops: LuStore,
        Users: LuUsers,
        "Rider Dashboard": LuLayoutDashboard,
        "Delivery Orders": LuClipboardList,
    };
    const canAccessSupport = ["admin", "manager", "sales"].includes(role);
    const toMinutes = (value) => Math.max(0, Math.round(Number(value || 0)));
    const formatWorkedTime = (value) => {
        const minutes = toMinutes(value);
        const hours = Math.floor(minutes / 60);
        const remain = minutes % 60;
        return `${hours}h ${remain}m`;
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

    // Notification State
    const [showNoti, setShowNoti] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [globalSearch, setGlobalSearch] = useState("");
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [openGroups, setOpenGroups] = useState({});
    const [themeMode, setThemeMode] = useState("system");
    const [resolvedTheme, setResolvedTheme] = useState("light");
    const [, setTimeTick] = useState(0);

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const notificationStorageKey = user?.id
        ? `larapee_admin_notifications_${user.id}_${role}`
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

    useEffect(() => {
        const timer = window.setInterval(() => {
            setTimeTick((prev) => prev + 1);
        }, 30000);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (!window.Echo || !user?.id) {
            return () => {};
        }

        const useShopScopedChannel = ["manager", "delivery", "sales"].includes(role) && user?.shop_id;
        const channelName = useShopScopedChannel
            ? `shop.${user.shop_id}.notifications`
            : "admin-notifications";
        const channel = channelName === "admin-notifications"
            ? window.Echo.channel(channelName)
            : window.Echo.private(channelName);

        channel.listen(".NewOrderPlaced", (e) => {
            const next = {
                id: `order-${e.id}-${Date.now()}`,
                type: "order",
                message: e.message,
                createdAt: e.created_at || new Date().toISOString(),
                isRead: false,
                url: route("admin.orders.show", e.id),
            };
            setNotifications((prev) => [next, ...prev].slice(0, 80));
        });

        channel.listen(".OrderStatusUpdated", (e) => {
            const next = {
                id: `order-status-${e.id}-${Date.now()}`,
                type: "order",
                message: e.message || `Order #${e.id} updated: ${String(e.status || "").toUpperCase()}`,
                createdAt: new Date().toISOString(),
                isRead: false,
                url: route("admin.orders.show", e.id),
            };
            setNotifications((prev) => [next, ...prev].slice(0, 80));
        });

        if (channelName === "admin-notifications") {
            channel.listen(".SupportMessageSent", (e) => {
                if (Number(e.sender_id) !== Number(e.customer_id)) {
                    return;
                }

                const next = {
                    id: `support-${e.id}`,
                    type: "support",
                    message: `Support: ${e.sender_name || "Customer"} - ${e.message}`,
                    createdAt: e.created_at || new Date().toISOString(),
                    isRead: false,
                    url: route("admin.support.index", { customer: e.customer_id }),
                };
                setNotifications((prev) => [next, ...prev].slice(0, 80));
            });

            channel.listen(".ManagerReportSubmitted", (e) => {
                const next = {
                    id: `daily-close-${e.shop_id || "unknown"}-${Date.now()}`,
                    type: "daily-close",
                    message: e.message || `Manager report submitted by ${e.manager_name || "Manager"}.`,
                    createdAt: e.created_at || new Date().toISOString(),
                    isRead: false,
                    url: route("admin.dashboard"),
                };
                setNotifications((prev) => [next, ...prev].slice(0, 80));
            });
        }

        return () => {
            if (window.Echo) {
                window.Echo.leave(channelName);
            }
        };
    }, [role, user?.id, user?.shop_id]);

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

    useEffect(() => {
        setOpenGroups((prev) => {
            const next = {};
            navGroups.forEach((group, index) => {
                const hasActiveLink = group.links.some((link) => isLinkActive(link));
                next[group.id] = hasActiveLink || (prev[group.id] ?? index === 0);
            });
            return next;
        });
    }, [page.url, role]);

    const toggleNavGroup = (groupId) => {
        setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    useEffect(() => {
        const saved = window.localStorage.getItem("larapee_admin_theme_mode");
        if (saved === "light" || saved === "dark" || saved === "system") {
            setThemeMode(saved);
        }
    }, []);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const applyTheme = () => {
            const nextTheme = themeMode === "system"
                ? (media.matches ? "dark" : "light")
                : themeMode;
            setResolvedTheme(nextTheme);
            document.documentElement.dataset.theme = nextTheme;
            document.documentElement.classList.toggle("dark", nextTheme === "dark");
        };

        applyTheme();
        media.addEventListener("change", applyTheme);
        window.localStorage.setItem("larapee_admin_theme_mode", themeMode);

        return () => {
            media.removeEventListener("change", applyTheme);
        };
    }, [themeMode]);

    const isDark = resolvedTheme === "dark";

    return (
        <div
            className={`min-h-screen flex ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}
        >
            {/* Sidebar */}
            <aside className={`w-72 hidden h-full fixed md:flex flex-col border-r shadow-sm ${isDark ? "bg-[#0b1220]/95 text-slate-200 border-white/10 backdrop-blur" : "bg-white text-slate-700 border-slate-200"}`}>
                <div className={`px-6 py-7 border-b ${isDark ? "border-white/10" : "border-slate-200"}`}>
                    <Link
                        href="/"
                        className={`text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-slate-800"}`}
                    >
                        LaraPee Admin
                    </Link>
                    <p className={`text-xs mt-1 uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {role === "delivery" ? "rider panel" : `${role} panel`}
                    </p>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
                    {navGroups.map((group) => {
                        const hasActiveLink = group.links.some((link) => isLinkActive(link));
                        const isOpen = Boolean(openGroups[group.id]);

                        return (
                            <div
                                key={group.id}
                                className={`rounded-2xl border ${isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50/80"}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleNavGroup(group.id)}
                                className={`w-full px-4 py-3 flex items-center justify-between rounded-2xl text-xs font-black uppercase tracking-[0.16em] transition ${
                                        hasActiveLink
                                            ? isDark
                                                ? "text-white bg-white/[0.08]"
                                                : "text-slate-800 bg-slate-200"
                                            : isDark
                                                ? "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                                                : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                                    }`}
                                >
                                    <span>{group.label}</span>
                                    <LuChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isOpen && (
                                    <div className="pb-3 px-2 space-y-1.5">
                                        {group.links.map((link) => {
                                            const LinkIcon = menuIconByLabel[link.label];
                                            return (
                                                <Link
                                                    key={link.route}
                                                    href={route(link.route)}
                                                    className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                                                        isLinkActive(link)
                                                            ? isDark
                                                                ? "bg-white/[0.1] text-white border border-white/10"
                                                                : "bg-slate-200 text-slate-800 border border-slate-300"
                                                            : isDark
                                                                ? "text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent"
                                                                : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-transparent"
                                                    }`}
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        {LinkIcon ? <LinkIcon className="h-4 w-4" /> : null}
                                                        {link.label}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className={`p-4 border-t ${isDark ? "border-white/10 bg-[#0b1220]" : "border-slate-200 bg-slate-50"}`}>
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                        {primaryIdentity}
                    </p>
                    <p className={`text-xs uppercase tracking-wider truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {secondaryIdentity}
                    </p>
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className={`mt-3 w-full rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-widest transition ${
                            isDark
                                ? "border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.12]"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                        Log out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ms-72 flex flex-col min-h-screen">
                <header className={`h-20 backdrop-blur border-b px-6 sticky top-0 z-50 ${isDark ? "bg-[#0b1220]/80 border-white/10" : "bg-white/90 border-slate-200"}`}>
                    <div className="h-full grid grid-cols-[auto,1fr,auto] items-center gap-6">
                        <div className={`text-lg font-black whitespace-nowrap ${isDark ? "text-slate-100" : "text-slate-900"}`}>
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
                                        <LuSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            className={`h-11 w-full rounded-full border ps-11 pe-4 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                                                isDark
                                                    ? "border-white/10 bg-white/[0.04] text-slate-100 placeholder:text-slate-400 focus:border-cyan-400/70 focus:bg-white/[0.06] focus:ring-cyan-400/20"
                                                    : "border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-orange-100"
                                            }`}
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

                        <div className="flex items-center gap-4 justify-self-end">
                        {canTrackAttendance && role !== "admin" && (
                            <div className={`hidden lg:flex items-center gap-2 border rounded-xl px-2 py-1 shadow-sm ${isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white"}`}>
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
                                className={`hidden sm:inline-flex px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                                    isDark
                                        ? "border-white/10 text-slate-200 hover:bg-white/[0.06]"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                Support Inbox
                            </Link>
                        )}

                        <LocaleSwitcher compact />

                        <select
                            aria-label="Theme"
                            value={themeMode}
                            onChange={(e) => setThemeMode(e.target.value)}
                            className={`h-9 rounded-lg border pl-2 pr-8 text-xs font-semibold ${
                                isDark
                                    ? "border-white/10 bg-white/[0.04] text-slate-100"
                                    : "border-slate-300 bg-white text-slate-700"
                            }`}
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                        </select>

                        {/* 🔔 Notification Icon Section */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNoti(!showNoti)}
                                className={`p-2 transition rounded-full focus:outline-none ${
                                    isDark
                                        ? "text-slate-300 hover:text-cyan-300 hover:bg-white/[0.06]"
                                        : "text-slate-500 hover:text-orange-600 hover:bg-slate-100"
                                }`}
                            >
                                <LuBell className="h-6 w-6" />

                                {/* 🎯 နံပါတ် Badge - ခေါင်းလောင်းပေါ်မှာ ကပ်ဖို့ absolute နဲ့ translate သုံးထားတယ် */}
                                {unreadCount > 0 && (
                                    <span className={`absolute top-1 right-1 flex h-5 w-5 transform translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ${isDark ? "ring-slate-900" : "ring-white"}`}>
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
                                    <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border py-2 z-20 overflow-hidden animate-in fade-in zoom-in duration-200 ${
                                        isDark ? "bg-[#0c1526] border-white/10" : "bg-white border-slate-100"
                                    }`}>
                                        <div className={`px-4 py-2 border-b flex justify-between items-center ${isDark ? "border-white/10" : "border-slate-50"}`}>
                                            <span className={`font-bold ${isDark ? "text-slate-100" : "text-slate-700"}`}>
                                                Notifications
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isDark ? "bg-cyan-400/15 text-cyan-300" : "bg-orange-100 text-orange-600"}`}>
                                                Recent
                                            </span>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto overscroll-contain" onWheel={containDropdownScroll}>
                                            {notifications.length > 0 ? (
                                                notifications.map((n) => (
                                                    <button
                                                        key={n.id}
                                                        type="button"
                                                        onClick={() => openNotification(n)}
                                                        className={`w-full text-left px-4 py-3 border-b last:border-0 cursor-pointer ${
                                                            isDark
                                                                ? `hover:bg-white/[0.06] border-white/10 ${!n.isRead ? "bg-cyan-400/10" : ""}`
                                                                : `hover:bg-slate-50 border-slate-50 ${!n.isRead ? "bg-blue-50/30" : ""}`
                                                        }`}
                                                    >
                                                        <p className={`text-sm leading-snug ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                                            {n.message}
                                                        </p>
                                                        <p className={`text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                                                            {formatRelativeTime(n.createdAt)}
                                                        </p>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className={`p-8 text-center text-sm ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                                                    Notification မရှိသေးပါ
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNotifications([])}
                                            className={`w-full py-2 text-xs font-bold transition uppercase tracking-widest ${
                                                isDark
                                                    ? "text-slate-400 hover:text-cyan-300 bg-white/[0.04]"
                                                    : "text-slate-400 hover:text-orange-600 bg-slate-50/50"
                                            }`}
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

                <main className={`flex-1 p-6 md:p-8 ${isDark ? "bg-transparent" : ""}`}>{children}</main>
            </div>
        </div>
    );
}
