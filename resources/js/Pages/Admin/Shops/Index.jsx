import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Index({ shops = [] }) {
    const [name, setName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");

    const createShop = (e) => {
        e.preventDefault();
        router.post(
            route("admin.shops.store"),
            { name },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setName("");
                    Swal.fire("Success", "Shop created.", "success");
                },
                onError: () => Swal.fire("Error", "Please check shop name.", "error"),
            },
        );
    };

    const updateShop = (shopId) => {
        if (!editingName.trim()) {
            Swal.fire("Error", "Shop name is required.", "error");
            return;
        }

        router.patch(
            route("admin.shops.update", shopId),
            { name: editingName },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingId(null);
                    setEditingName("");
                    Swal.fire("Updated", "Shop updated.", "success");
                },
            },
        );
    };

    const deleteShop = (shop) => {
        Swal.fire({
            title: `Delete ${shop.name}?`,
            text: "This is allowed only when no products, users, or orders are linked.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.delete(route("admin.shops.destroy", shop.id), {
                preserveScroll: true,
                onSuccess: () => Swal.fire("Deleted", "Shop removed.", "success"),
            });
        });
    };

    return (
        <AdminLayout header="Shops">
            <Head title="Admin Shops" />

            <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-black text-slate-900 mb-4 text-lg">Create Shop</h3>
                    <form onSubmit={createShop} className="flex flex-col sm:flex-row gap-3">
                        <input
                            className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5"
                            placeholder="Shop name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <button className="bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-orange-700 transition">
                            Create
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-orange-50">
                        <h3 className="font-black text-slate-900 text-lg">Shops</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50">
                                <tr className="text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4 font-bold">Name</th>
                                    <th className="px-6 py-4 font-bold">Products</th>
                                    <th className="px-6 py-4 font-bold">Staff</th>
                                    <th className="px-6 py-4 font-bold">Orders</th>
                                    <th className="px-6 py-4 font-bold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {shops?.length ? (
                                    shops.map((shop) => {
                                        const hasLinks =
                                            Number(shop.products_count || 0) > 0 ||
                                            Number(shop.users_count || 0) > 0 ||
                                            Number(shop.orders_count || 0) > 0;

                                        return (
                                            <tr key={shop.id} className="hover:bg-orange-50/30 transition">
                                                <td className="px-6 py-4">
                                                    {editingId === shop.id ? (
                                                        <input
                                                            className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="font-semibold text-slate-700 text-sm">{shop.name}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{shop.products_count}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{shop.users_count}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{shop.orders_count}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {editingId === shop.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => updateShop(shop.id)}
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                                                                    title="Save"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.436a1 1 0 111.414-1.414l3.929 3.928 6.657-6.657a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingId(null);
                                                                        setEditingName("");
                                                                    }}
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                                                                    title="Cancel"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingId(shop.id);
                                                                    setEditingName(shop.name);
                                                                }}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                                                title="Edit"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M17.414 2.586a2 2 0 010 2.828l-8.19 8.19a2 2 0 01-.878.513l-3.2.914a1 1 0 01-1.236-1.236l.914-3.2a2 2 0 01.513-.878l8.19-8.19a2 2 0 012.828 0z" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => deleteShop(shop)}
                                                            disabled={hasLinks}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title={hasLinks ? "Cannot delete linked shop" : "Delete"}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6-1a1 1 0 10-2 0v7a1 1 0 102 0V7zm-7-3a2 2 0 012-2h6a2 2 0 012 2v1h2a1 1 0 110 2h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 010-2h2V4z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center text-slate-400 italic">
                                            No shops yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
