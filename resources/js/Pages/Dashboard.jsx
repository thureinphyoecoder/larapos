import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function Dashboard({ orderCount = 0, recentOrders = [] }) {
    const { auth } = usePage().props;
    const userName = auth?.user?.name || "Customer";
    const [activeSlide, setActiveSlide] = useState(0);
    const [pauseSlider, setPauseSlider] = useState(false);

    const heroSlides = [
        {
            id: 1,
            label: "Weekend Picks",
            title: "Smart gadgets and daily essentials",
            subtitle: "Fresh offers are live now. Check trending products and buy instantly.",
            image: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1400&q=80",
            accent: "from-orange-600 via-amber-500 to-yellow-400",
        },
        {
            id: 2,
            label: "Hot Deal",
            title: "Fashion, home and lifestyle picks",
            subtitle: "Explore curated products from top shops with fast checkout flow.",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80",
            accent: "from-cyan-700 via-sky-600 to-emerald-400",
        },
        {
            id: 3,
            label: "New Arrival",
            title: "Upgrade your cart in minutes",
            subtitle: "Buy now, track delivery and chat with support anytime in one place.",
            image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1400&q=80",
            accent: "from-rose-700 via-red-600 to-orange-500",
        },
    ];

    useEffect(() => {
        if (pauseSlider) return;

        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % heroSlides.length);
        }, 4800);

        return () => clearInterval(timer);
    }, [pauseSlider, heroSlides.length]);

    const currentSlide = heroSlides[activeSlide];

    return (
        <AuthenticatedLayout>
            <Head title="Customer Dashboard" />
            <div className="py-8 sm:py-10 bg-slate-100 min-h-screen">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-slate-400">
                            Welcome Back
                        </p>
                        <h1 className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                            {userName}, ready to shop today?
                        </h1>
                        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl">
                            Discover fresh deals, manage your orders and get real-time support in one dashboard.
                        </p>
                    </div>

                    <div
                        onMouseEnter={() => setPauseSlider(true)}
                        onMouseLeave={() => setPauseSlider(false)}
                        className="relative overflow-hidden rounded-3xl shadow-xl min-h-[320px] sm:min-h-[380px]"
                    >
                        <img
                            src={currentSlide.image}
                            alt={currentSlide.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.accent} opacity-75`} />
                        <div className="absolute inset-0 bg-black/25" />

                        <div className="relative z-10 p-6 sm:p-10 h-full flex flex-col justify-between">
                            <div className="space-y-4 max-w-2xl">
                                <span className="inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-white border border-white/40">
                                    {currentSlide.label}
                                </span>
                                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                                    {currentSlide.title}
                                </h2>
                                <p className="text-white/90 text-sm sm:text-base">
                                    {currentSlide.subtitle}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href={route("home")}
                                    className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black hover:bg-slate-100 transition"
                                >
                                    Shop Now
                                </Link>
                                <Link
                                    href={route("orders.index")}
                                    className="px-6 py-3 rounded-2xl border border-white/60 text-white font-bold hover:bg-white/10 transition"
                                >
                                    View Orders
                                </Link>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setActiveSlide(
                                    (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
                                )
                            }
                            className="absolute z-30 left-3 sm:left-5 bottom-5 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 font-black shadow"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlides.length)}
                            className="absolute z-30 right-3 sm:right-5 bottom-5 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 font-black shadow"
                        >
                            ›
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                            {heroSlides.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    type="button"
                                    onClick={() => setActiveSlide(index)}
                                    className={`h-2.5 rounded-full transition ${
                                        index === activeSlide
                                            ? "w-8 bg-white"
                                            : "w-2.5 bg-white/50 hover:bg-white/80"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <p className="text-xs uppercase tracking-widest text-slate-400">
                                Total Orders
                            </p>
                            <p className="mt-2 text-3xl font-black text-orange-600">
                                {orderCount}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                All time
                            </p>
                        </div>
                        <Link
                            href={route("home")}
                            className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-sm border border-orange-300 p-5 text-white hover:shadow-md transition"
                        >
                            <p className="text-xs uppercase tracking-widest text-white/80">
                                Shopping
                            </p>
                            <p className="mt-2 font-black text-lg">
                                Explore Products
                            </p>
                            <span className="mt-3 inline-flex text-xs font-bold text-white">
                                Go to store →
                            </span>
                        </Link>
                        <Link
                            href={route("orders.index")}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition"
                        >
                            <p className="text-xs uppercase tracking-widest text-slate-400">
                                Order Tracking
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                                Track, cancel and view receipts
                            </p>
                            <span className="mt-3 inline-flex text-xs font-bold text-sky-600">
                                Manage orders →
                            </span>
                        </Link>
                        <Link
                            href={route("support.index")}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition"
                        >
                            <p className="text-xs uppercase tracking-widest text-slate-400">
                                Support
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                                Need help from manager?
                            </p>
                            <span className="mt-3 inline-flex text-xs font-bold text-orange-600">
                                Open support chat →
                            </span>
                        </Link>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">
                                Recent Orders
                            </h3>
                            <Link
                                href={route("orders.index")}
                                className="text-xs font-bold text-orange-600"
                            >
                                View all
                            </Link>
                        </div>

                        {/* Mobile cards */}
                        <div className="p-4 space-y-3 sm:hidden">
                            {recentOrders.length ? (
                                recentOrders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={route("orders.show", order.id)}
                                        className="block bg-slate-50 rounded-2xl p-4 border border-slate-100"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-700">
                                                #{order.id}
                                            </span>
                                            <span className="text-[10px] uppercase font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-600">
                                            {Number(
                                                order.total_amount,
                                            ).toLocaleString()}{" "}
                                            MMK
                                        </p>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center text-slate-400 py-8">
                                    No orders yet.
                                </div>
                            )}
                        </div>

                        {/* Desktop table */}
                        <div className="overflow-x-auto hidden sm:block">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4 font-bold">
                                            Order ID
                                        </th>
                                        <th className="px-6 py-4 font-bold">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 font-bold">
                                            Total
                                        </th>
                                        <th className="px-6 py-4 font-bold">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentOrders.length ? (
                                        recentOrders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4 font-semibold">
                                                    #{order.id}
                                                </td>
                                                <td className="px-6 py-4 uppercase text-sm text-slate-600">
                                                    {order.status}
                                                </td>
                                                <td className="px-6 py-4 font-bold">
                                                    {Number(
                                                        order.total_amount,
                                                    ).toLocaleString()}{" "}
                                                    MMK
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <Link
                                                        href={route(
                                                            "orders.show",
                                                            order.id,
                                                        )}
                                                        className="text-orange-600 font-semibold hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="p-8 text-center text-slate-400"
                                            >
                                                No orders yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
