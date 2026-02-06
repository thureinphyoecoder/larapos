// resources/js/Pages/Dashboard.jsx
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function Dashboard({ orderCount = 0, recentOrders = [] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Customer Dashboard" />
            <div className="py-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 text-white shadow-lg">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/80">
                            Customer Space
                        </p>
                        <h2 className="mt-2 text-2xl sm:text-3xl font-black">
                            Welcome back to LaraPee
                        </h2>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Link
                                href={route("orders.index")}
                                className="bg-white text-orange-600 px-4 py-2 rounded-full text-sm font-bold shadow"
                            >
                                My Orders
                            </Link>
                            <Link
                                href={route("profile.edit")}
                                className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold border border-white/30"
                            >
                                Edit Profile
                            </Link>
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
                            href={route("orders.index")}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition"
                        >
                            <p className="text-xs uppercase tracking-widest text-slate-400">
                                Orders
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                                Track & cancel pending
                            </p>
                            <span className="mt-3 inline-flex text-xs font-bold text-orange-600">
                                View orders →
                            </span>
                        </Link>
                        <Link
                            href={route("profile.edit")}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition"
                        >
                            <p className="text-xs uppercase tracking-widest text-slate-400">
                                Profile
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                                Name, password, location
                            </p>
                            <span className="mt-3 inline-flex text-xs font-bold text-orange-600">
                                Update profile →
                            </span>
                        </Link>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                            <p className="text-xs uppercase tracking-widest text-slate-400">
                                Support
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                                Need help?
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Contact support anytime
                            </p>
                        </div>
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
