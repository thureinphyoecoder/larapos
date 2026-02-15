import { router, Head, useForm, usePage } from "@inertiajs/react";
import { LuCheckCheck, LuImage, LuMapPin } from "react-icons/lu";
import Swal from "sweetalert2";

export default function Confirm({ formData, cartItems }) {
    const page = usePage();
    const { i18n = {} } = page.props;
    const t = (key, fallback) => i18n?.[key] || fallback;

    const calculatedTotal = cartItems.reduce(
        (sum, item) =>
            sum +
            Number(
                item.line_total ||
                    (item.effective_unit_price || item.variant?.price || 0) *
                        item.quantity,
            ),
        0,
    );
    const totalDiscount = cartItems.reduce(
        (sum, item) => sum + Number(item.discount_line_total || 0),
        0,
    );

    const { post, processing } = useForm({
        phone: formData.phone,
        address: formData.address,
        payment_slip: formData.payment_slip,
        total_amount: calculatedTotal,
    });

    const handleEdit = () => {
        router.visit(route("checkout.index"), {
            method: "get",
            data: {
                phone: formData.phone,
                address: formData.address,
            },
        });
    };

    const submitOrder = (e) => {
        e.preventDefault();
        post(route("orders.store"), {
            onError: (errors) => {
                const firstError =
                    errors.system_error ||
                    errors.payment_slip ||
                    errors.phone ||
                    errors.address ||
                    t("checkout_submit_failed", "Unable to submit order.");
                Swal.fire({
                    icon: "error",
                    title: t("checkout_submit_failed", "Unable to submit order."),
                    text: firstError,
                    confirmButtonColor: "#ea580c",
                });
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title={t("checkout_confirm_page_title", "Order Confirmation")} />
            <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="mb-6 flex items-center text-2xl font-bold text-slate-800 dark:text-slate-100">
                    <LuCheckCheck className="mr-2 h-5 w-5 text-orange-600" /> {t("checkout_confirm_heading", "Please confirm your order")}
                </h2>

                <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
                        <h4 className="mb-3 flex items-center font-bold text-blue-800 dark:text-sky-300">
                            <LuMapPin className="mr-2 h-4 w-4" /> {t("checkout_confirm_address", "Delivery address")}
                        </h4>
                        <div className="space-y-1 text-slate-700 dark:text-slate-300">
                            <p>
                                <span className="font-medium">{t("checkout_phone", "Phone number")}:</span>{" "}
                                {formData.phone}
                            </p>
                            <p>
                                <span className="font-medium">{t("checkout_address", "Address")}:</span>{" "}
                                {formData.address}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-800">
                        <h4 className="mb-3 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                            <LuImage className="mr-2 h-4 w-4" /> {t("checkout_confirm_slip", "Transfer slip")}
                        </h4>
                        <img
                            src={`/storage/${formData.payment_slip}`}
                            className="mx-auto h-40 rounded-lg border-2 border-white shadow-md dark:border-slate-700"
                            alt={t("checkout_confirm_slip", "Transfer slip")}
                        />
                    </div>
                </div>

                <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-100 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <th className="p-4 text-left font-bold">
                                    {t("checkout_confirm_product_name", "Product")}
                                </th>
                                <th className="p-4 text-center font-bold">
                                    {t("checkout_confirm_quantity", "Quantity")}
                                </th>
                                <th className="p-4 text-right font-bold">
                                    {t("checkout_confirm_price", "Price")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {cartItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70">
                                    <td className="p-4 font-medium text-slate-700 dark:text-slate-200">
                                        {item.variant.product.name}
                                    </td>
                                    <td className="p-4 text-center text-slate-600 dark:text-slate-300">
                                        {item.quantity}
                                    </td>
                                    <td className="p-4 text-right font-semibold text-slate-800 dark:text-slate-100">
                                        {(
                                            Number(
                                                item.line_total ||
                                                    (item.effective_unit_price ||
                                                        item.variant?.price ||
                                                        0) *
                                                        item.quantity,
                                            )
                                        ).toLocaleString()} Ks
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-slate-900 p-6 text-white dark:bg-slate-800 md:flex-row">
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-orange-400">
                            {t("checkout_confirm_total", "Total")}: {calculatedTotal.toLocaleString()} Ks
                        </div>
                        {totalDiscount > 0 && (
                            <div className="text-sm font-semibold text-emerald-300">
                                {t("cart_discount", "Promotion Discount")}: -{totalDiscount.toLocaleString()} Ks
                            </div>
                        )}
                    </div>

                    <div className="flex w-full gap-4 md:w-auto">
                        <button
                            onClick={handleEdit}
                            disabled={processing}
                            className="flex-1 rounded-xl border border-slate-500 px-8 py-3 font-bold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50 md:flex-none dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            {t("checkout_back_edit", "Edit")}
                        </button>

                        <button
                            onClick={submitOrder}
                            disabled={processing}
                            className="flex-1 rounded-xl bg-orange-600 px-10 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-orange-700 active:scale-95 disabled:bg-slate-600 md:flex-none"
                        >
                            {processing ? t("checkout_submit_processing", "Submitting...") : t("checkout_submit_order", "Place order")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
