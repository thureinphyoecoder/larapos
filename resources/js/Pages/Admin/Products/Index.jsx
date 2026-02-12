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

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/80">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Products</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage catalog, pricing and visibility</p>
                    </div>
                    <Link
                        href={route("admin.products.create")}
                        className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-500"
                    >
                        Add Product
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/70">
                            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                <th className="px-6 py-4 font-bold">Image</th>
                                <th className="px-6 py-4 font-bold">Name</th>
                                <th className="px-6 py-4 font-bold">SKU</th>
                                <th className="px-6 py-4 font-bold">Category</th>
                                <th className="px-6 py-4 font-bold">Shop</th>
                                <th className="px-6 py-4 font-bold">Variants</th>
                                <th className="px-6 py-4 font-bold">Hero</th>
                                <th className="px-6 py-4 font-bold">Price Range</th>
                                <th className="px-6 py-4 font-bold">Total Stock</th>
                                <th className="px-6 py-4 font-bold">Stock Status</th>
                                <th className="px-6 py-4 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {products?.length ? (
                                products.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <td className="px-6 py-4">
                                            {product.image_path ? (
                                                <img
                                                    src={`/storage/${product.image_path}`}
                                                    alt={product.name}
                                                    className="h-12 w-12 rounded border border-slate-200 object-cover dark:border-slate-700"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                                            {product.sku || "No SKU"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {product.category?.name || "Not assigned"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {product.shop?.name || "Not assigned"}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {(() => {
                                                const activeVariants = (product.variants || []).filter((variant) => variant.is_active ?? true);
                                                const promoVariants = activeVariants.filter((variant) => Boolean(variant.promo_type));
                                                return (
                                                    <div className="space-y-1">
                                                        <p>{activeVariants.length}</p>
                                                        {promoVariants.length > 0 && (
                                                            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-300">
                                                                {promoVariants.length} promo
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.patch(
                                                        route("admin.products.toggleHero", product.id),
                                                        { is_hero: !Boolean(product.is_hero) },
                                                        { preserveScroll: true },
                                                    )
                                                }
                                                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
                                                    product.is_hero
                                                        ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                                }`}
                                            >
                                                {product.is_hero ? "Hero On" : "Hero Off"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">
                                            {(() => {
                                                const activeVariants = (product.variants || []).filter((variant) => variant.is_active ?? true);
                                                if (!activeVariants.length) return "No active variant";
                                                const prices = activeVariants.map((variant) => Number(variant.price || 0));
                                                const min = Math.min(...prices);
                                                const max = Math.max(...prices);
                                                if (min === max) return `${min.toLocaleString()} MMK`;
                                                return `${min.toLocaleString()} - ${max.toLocaleString()} MMK`;
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                                            {Number(product.stock_level || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const stock = Number(product.stock_level || 0);
                                                if (stock <= 0) {
                                                    return (
                                                        <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                                            Out of stock
                                                        </span>
                                                    );
                                                }
                                                if (stock <= 5) {
                                                    return (
                                                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                                            Low stock
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                                        In stock
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={route("admin.products.edit", product.id)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
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
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
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
                                        colSpan="11"
                                        className="p-12 text-center italic text-slate-400 dark:text-slate-500"
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
