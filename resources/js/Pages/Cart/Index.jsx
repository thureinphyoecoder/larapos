import { Link, router, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function Index({ cartItems = [] }) {
    const isCartEmpty = cartItems.length === 0;
    const page = usePage();
    const { i18n = {} } = page.props;
    const t = (key, fallback) => i18n?.[key] || fallback;

    const totalPrice = cartItems.reduce((sum, item) => {
        return sum + Number(item.line_total || (item.effective_unit_price || item.variant?.price || 0) * item.quantity);
    }, 0);

    const totalDiscount = cartItems.reduce((sum, item) => {
        return sum + Number(item.discount_line_total || 0);
    }, 0);

    const removeFromCart = (id) => {
        Swal.fire({
            title: t("cart_remove_confirm_title", "Are you sure?"),
            text: t("cart_remove_confirm_text", "Do you want to remove this item from cart?"),
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#f97316",
            cancelButtonText: t("cart_remove_cancel", "Cancel"),
            confirmButtonText: t("cart_remove_confirm", "Remove"),
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/cart/${id}`, {
                    onSuccess: () => Swal.fire(t("cart_removed_success", "Removed from cart"), "", "success"),
                });
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <header className="mb-6 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <Link href="/" className="text-2xl font-black text-orange-500 dark:text-orange-400">
                        {t("cart_title", "LaraPee | Cart")}
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4">
                <h2 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-100">
                    {t("cart_heading", "Your selected items")}
                </h2>

                <div className="flex flex-col gap-6 md:flex-row">
                    <div className="flex-1 space-y-4">
                        {cartItems.length > 0 ? (
                            cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <div className="flex h-20 w-20 items-center justify-center rounded bg-slate-100 p-1 text-center text-[10px] font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                        {item.product.brand?.name || t("cart_no_brand", "No Brand")}
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="font-medium text-slate-800 dark:text-slate-100">
                                            {item.product.name}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t("cart_variant", "Variant")}: {item.variant.sku}
                                        </p>
                                        <p className="mt-1 font-bold text-orange-600 dark:text-orange-400">
                                            Ks {Number(item.effective_unit_price || item.variant?.price || 0).toLocaleString()}
                                        </p>
                                        {Number(item.discount_line_total || 0) > 0 && (
                                            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                {t("cart_discount", "Promotion Discount")}: -Ks {Number(item.discount_line_total).toLocaleString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            {t("cart_qty", "Qty")}: {item.quantity}
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-slate-400 transition hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                                            title={t("cart_remove", "Remove")}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <p className="mb-4 text-slate-500 dark:text-slate-400">
                                    {t("cart_empty", "Your cart is empty")}
                                </p>
                                <Link
                                    href="/"
                                    className="inline-block rounded-lg bg-orange-500 px-8 py-3 font-bold text-white transition hover:bg-orange-600"
                                >
                                    {t("cart_shop_now", "Shop now")}
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="md:w-80">
                        <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <h3 className="mb-4 border-b border-slate-200 pb-2 font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100">
                                {t("cart_summary", "Summary")}
                            </h3>
                            <div className="mb-6 flex justify-between">
                                <span className="text-slate-600 dark:text-slate-300">
                                    {t("cart_total", "Total")}
                                </span>
                                <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                    Ks {totalPrice.toLocaleString()}
                                </span>
                            </div>

                            {totalDiscount > 0 && (
                                <div className="mb-6 flex justify-between text-sm">
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                        {t("cart_discount", "Promotion Discount")}
                                    </span>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                        -Ks {totalDiscount.toLocaleString()}
                                    </span>
                                </div>
                            )}

                            <Link
                                href={isCartEmpty ? "#" : route("checkout.index")}
                                as="button"
                                disabled={isCartEmpty}
                                className={`w-full rounded-xl py-3 font-bold text-white transition shadow-md ${
                                    isCartEmpty
                                        ? "cursor-not-allowed bg-slate-300 shadow-none dark:bg-slate-700"
                                        : "bg-orange-600 hover:bg-orange-700 active:scale-95"
                                }`}
                            >
                                {isCartEmpty
                                    ? t("cart_select_items_first", "Select items first")
                                    : t("cart_checkout", "Checkout")}
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
