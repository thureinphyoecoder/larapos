import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function Index({ products }) {
    return (
        <AdminLayout header="Products">
            <Head title="Admin Products" />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Products</h3>
                    <Link
                        href={route("admin.products.create")}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                        Add Product
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-50">
                                <th className="px-6 py-4 font-bold">Image</th>
                                <th className="px-6 py-4 font-bold">Name</th>
                                <th className="px-6 py-4 font-bold">Category</th>
                                <th className="px-6 py-4 font-bold">Shop</th>
                                <th className="px-6 py-4 font-bold">Price</th>
                                <th className="px-6 py-4 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products?.length ? (
                                products.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-slate-50/80 transition"
                                    >
                                        <td className="px-6 py-4">
                                            {product.image_path ? (
                                                <img
                                                    src={`/storage/${product.image_path}`}
                                                    alt={product.name}
                                                    className="h-12 w-12 rounded object-cover border"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded bg-slate-100 border" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700 text-sm">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {product.category?.name || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {product.shop?.name || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                            {product.price} MMK
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={route("admin.products.edit", product.id)}
                                                    className="text-blue-600 font-semibold hover:underline"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        Swal.fire({
                                                            title: "Delete product?",
                                                            text: "This action cannot be undone.",
                                                            icon: "warning",
                                                            showCancelButton: true,
                                                            confirmButtonText: "Delete",
                                                        }).then((result) => {
                                                            if (!result.isConfirmed) return;
                                                            router.delete(
                                                                route("admin.products.destroy", product.id),
                                                                {
                                                                    onSuccess: () =>
                                                                        Swal.fire(
                                                                            "Deleted",
                                                                            "Product removed.",
                                                                            "success",
                                                                        ),
                                                                },
                                                            );
                                                        })
                                                    }
                                                    className="text-red-500 font-semibold hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="p-12 text-center text-slate-400 italic"
                                    >
                                        No products yet.
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
