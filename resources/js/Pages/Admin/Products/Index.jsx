import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function Index({ products }) {
    const { auth } = usePage().props;
    const role = auth?.role || "admin";
    const canDeleteProduct = ["admin", "manager"].includes(role);

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
                                <th className="px-6 py-4 font-bold">Variants</th>
                                <th className="px-6 py-4 font-bold">Price Range</th>
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
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                                            {(product.variants || []).filter((variant) => variant.is_active ?? true).length}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                            {(() => {
                                                const activeVariants = (product.variants || []).filter((variant) => variant.is_active ?? true);
                                                if (!activeVariants.length) return "N/A";
                                                const prices = activeVariants.map((variant) => Number(variant.price || 0));
                                                const min = Math.min(...prices);
                                                const max = Math.max(...prices);
                                                if (min === max) return `${min.toLocaleString()} MMK`;
                                                return `${min.toLocaleString()} - ${max.toLocaleString()} MMK`;
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={route("admin.products.edit", product.id)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                                    title="Edit product"
                                                    aria-label="Edit product"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M17.414 2.586a2 2 0 010 2.828l-8.19 8.19a2 2 0 01-.878.513l-3.2.914a1 1 0 01-1.236-1.236l.914-3.2a2 2 0 01.513-.878l8.19-8.19a2 2 0 012.828 0z" />
                                                    </svg>
                                                </Link>
                                                {canDeleteProduct && (
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
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                        title="Delete product"
                                                        aria-label="Delete product"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6-1a1 1 0 10-2 0v7a1 1 0 102 0V7zm-7-3a2 2 0 012-2h6a2 2 0 012 2v1h2a1 1 0 110 2h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 010-2h2V4z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
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
