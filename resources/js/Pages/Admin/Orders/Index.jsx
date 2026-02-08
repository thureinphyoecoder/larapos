import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";

const STATUS_TONE = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-sky-100 text-sky-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
    refunded: "bg-fuchsia-100 text-fuchsia-700",
    returned: "bg-violet-100 text-violet-700",
};

export default function Index({ orders }) {
    const rows = orders?.data || orders || [];

    return (
        <AdminLayout header="Orders">
            <Head title="Admin Orders" />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">Orders</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-50">
                                <th className="px-6 py-4 font-bold">Order ID</th>
                                <th className="px-6 py-4 font-bold">Customer</th>
                                <th className="px-6 py-4 font-bold">Shop</th>
                                <th className="px-6 py-4 font-bold">Amount</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rows.length > 0 ? (
                                rows.map((order) => {
                                    const statusKey = String(order.status || "pending").toLowerCase();
                                    const tone = STATUS_TONE[statusKey] || "bg-slate-100 text-slate-700";
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/80 transition">
                                            <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {order.user?.name || "Customer not set"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {order.shop?.name || "Shop not assigned"}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                                {order.total_amount} MMK
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase ${tone}`}>
                                                    {order.status || "pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={route("admin.orders.show", order.id)}
                                                    className="text-orange-600 font-semibold text-sm hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="p-12 text-center text-slate-400 italic"
                                    >
                                        No orders yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
