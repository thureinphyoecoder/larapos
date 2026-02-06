import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";

export default function Index({ shops }) {
    return (
        <AdminLayout header="Shops">
            <Head title="Admin Shops" />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">Shops</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-50">
                                <th className="px-6 py-4 font-bold">Name</th>
                                <th className="px-6 py-4 font-bold">Products</th>
                                <th className="px-6 py-4 font-bold">Staff</th>
                                <th className="px-6 py-4 font-bold">Orders</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {shops?.length ? (
                                shops.map((shop) => (
                                    <tr
                                        key={shop.id}
                                        className="hover:bg-slate-50/80 transition"
                                    >
                                        <td className="px-6 py-4 font-semibold text-slate-700 text-sm">
                                            {shop.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {shop.products_count}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {shop.users_count}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {shop.orders_count}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="p-12 text-center text-slate-400 italic"
                                    >
                                        No shops yet.
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
