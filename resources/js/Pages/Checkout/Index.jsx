import { useForm, Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import { LuMapPin } from "react-icons/lu";
import Swal from "sweetalert2";

export default function Checkout({ cartItems, user }) {
    const page = usePage();
    const { i18n = {} } = page.props;
    const t = (key, fallback) => i18n?.[key] || fallback;

    const totalPrice = cartItems.reduce(
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

    const queryParams = new URLSearchParams(window.location.search);
    const [locating, setLocating] = useState(false);
    const [locationMessage, setLocationMessage] = useState("");
    const [locationError, setLocationError] = useState("");

    const { data, setData, post, processing, errors } = useForm({
        phone: queryParams.get("phone") || user.phone || "",
        address: queryParams.get("address") || user.address || "",
        total_amount: totalPrice,
        payment_slip: null,
    });

    const handleOrder = (e) => {
        e.preventDefault();

        if (!data.phone || !data.address) {
            Swal.fire({
                title: t("checkout_error_title", "Something went wrong"),
                text: t("checkout_phone_address_required", "Please fill phone number and address."),
                icon: "warning",
            });
            return;
        }

        if (!data.payment_slip) {
            Swal.fire({
                title: t("checkout_error_title", "Something went wrong"),
                text: t("checkout_slip_required", "Please upload transfer slip (screenshot)."),
                icon: "warning",
            });
            return;
        }

        post(route("checkout.confirm"), {
            forceFormData: true,
            onError: (err) => {
                const systemError = err.message || err.system_error;
                const validationErrors = Object.values(err).flat().join("<br>");

                Swal.fire({
                    title: t("checkout_error_title", "Something went wrong"),
                    html: `<div class="text-left text-sm text-red-600">${systemError || validationErrors}</div>`,
                    icon: "error",
                    confirmButtonText: t("checkout_error_retry", "Try again"),
                    confirmButtonColor: "#ea580c",
                });
            },
        });
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("This browser does not support location access.");
            setLocationMessage("");
            return;
        }
        if (!window.isSecureContext) {
            setLocationError("Location access requires HTTPS or localhost.");
            setLocationMessage("");
            return;
        }

        const requestLocation = () => {
            setLocating(true);
            setLocationError("");
            setLocationMessage("");

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
                        );
                        const payload = await response.json();
                        const resolvedAddress = payload?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                        setData("address", resolvedAddress);
                        setLocationMessage("Current location has been applied.");
                    } catch {
                        setData("address", `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                        setLocationMessage("Coordinates have been applied as address.");
                    } finally {
                        setLocating(false);
                    }
                },
                (error) => {
                    setLocating(false);
                    if (error?.code === 1) {
                        setLocationError("Location permission is blocked. Please allow it in browser site settings.");
                        return;
                    }
                    if (error?.code === 2) {
                        setLocationError("Unable to retrieve current location. Please check GPS/Network and retry.");
                        return;
                    }
                    if (error?.code === 3) {
                        setLocationError("Location request timed out. Please retry.");
                        return;
                    }
                    setLocationError("Unable to retrieve location permission or coordinates.");
                },
                { enableHighAccuracy: true, timeout: 18000, maximumAge: 0 },
            );
        };

        const promptThenRequest = () => {
            Swal.fire({
                title: "Location Access",
                text: "Allow location to auto-fill nearby address.",
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Allow Location",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#0284c7",
            }).then((result) => {
                if (result.isConfirmed) {
                    requestLocation();
                }
            });
        };

        if (navigator.permissions?.query) {
            navigator.permissions
                .query({ name: "geolocation" })
                .then((permissionStatus) => {
                    if (permissionStatus.state === "denied") {
                        setLocationError("Location permission is blocked. Change Site Settings > Location to Allow and retry.");
                        setLocationMessage("");
                        return;
                    }
                    if (permissionStatus.state === "prompt") {
                        promptThenRequest();
                        return;
                    }
                    requestLocation();
                })
                .catch(() => promptThenRequest());
            return;
        }

        promptThenRequest();
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title={t("checkout_page_title", "Checkout")} />
            <div className="mx-auto max-w-4xl px-4 py-8">
                <h1 className="mb-6 text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {t("checkout_heading", "Checkout")}
                </h1>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <h2 className="mb-4 flex items-center border-b border-slate-200 pb-2 text-lg font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100">
                                <LuMapPin className="mr-2 h-4 w-4 text-orange-500" />
                                {t("checkout_delivery_address", "Delivery address")}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {t("checkout_phone", "Phone number")}
                                    </label>
                                    <input
                                        type="tel"
                                        pattern="[0-9]*"
                                        required
                                        className={`w-full rounded-lg border bg-white p-2.5 text-slate-800 outline-none transition focus:ring-2 focus:ring-orange-500 dark:bg-slate-900 dark:text-slate-100 ${errors.phone ? "border-red-500" : "border-slate-300 dark:border-slate-700"}`}
                                        value={data.phone}
                                        onChange={(e) => setData("phone", e.target.value)}
                                        placeholder="09xxxxxxxx"
                                    />
                                    {errors.phone && (
                                        <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {t("checkout_address", "House number, street, township, city")}
                                    </label>
                                    <textarea
                                        className={`h-24 w-full rounded-lg border bg-white p-2.5 text-slate-800 outline-none transition focus:ring-2 focus:ring-orange-500 dark:bg-slate-900 dark:text-slate-100 ${errors.address ? "border-red-500" : "border-slate-300 dark:border-slate-700"}`}
                                        value={data.address}
                                        onChange={(e) => setData("address", e.target.value)}
                                        placeholder="No.12, Baho Road, Kamaryut, Yangon"
                                    />
                                    <div className="mt-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleUseCurrentLocation}
                                            disabled={locating}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${locating ? "bg-slate-400 dark:bg-slate-600" : "bg-sky-600 hover:bg-sky-700"}`}
                                        >
                                            {locating ? t("checkout_locating", "Locating...") : t("checkout_use_location", "Use Current Location")}
                                        </button>
                                        {locationMessage ? (
                                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{locationMessage}</span>
                                        ) : null}
                                    </div>
                                    {locationError ? (
                                        <p className="mt-1 text-xs text-red-500">{locationError}</p>
                                    ) : null}
                                    {errors.address && (
                                        <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <h2 className="mb-3 flex items-center text-lg font-bold text-slate-800 dark:text-slate-100">
                                <span className="mr-2">💳</span>
                                {t("checkout_payment_method", "Payment method")}
                            </h2>
                            <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 dark:border-orange-500/30 dark:bg-orange-500/10">
                                <p className="mb-2 text-sm font-bold text-orange-800 dark:text-orange-300">
                                    {t("checkout_prepay_notice", "Please transfer in advance to the account below.")}
                                </p>
                                <div className="space-y-2 rounded border border-orange-100 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                    <div className="flex justify-between">
                                        <span>KPay / Wave:</span>
                                        <span className="font-bold">09 123 456 789</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                                        <span>{t("checkout_name", "Name")}:</span>
                                        <span className="font-bold">U Thurein Phyo</span>
                                    </div>
                                </div>
                                <p className="mt-3 text-[11px] italic text-orange-600 dark:text-orange-400">
                                    {t("checkout_slip_hint", "* Please upload transfer slip after payment.")}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <h2 className="mb-4 border-b border-slate-200 pb-2 font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100">
                                {t("checkout_order_summary", "Order summary")}
                            </h2>
                            <div className="mb-4 max-h-60 overflow-y-auto pr-2">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="mb-3 flex justify-between text-sm">
                                        <div className="flex flex-col">
                                            <span className="w-32 truncate font-medium text-slate-700 dark:text-slate-200">
                                                {item.product.name}
                                            </span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                {t("cart_qty", "Qty")}: {item.quantity}
                                            </span>
                                        </div>
                                        <span className="text-slate-600 dark:text-slate-300">
                                            Ks {(
                                                Number(
                                                    item.line_total ||
                                                        (item.effective_unit_price || item.variant?.price || 0) *
                                                            item.quantity,
                                                )
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {totalDiscount > 0 && (
                                <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-emerald-700 dark:border-slate-700 dark:text-emerald-400">
                                    <span>{t("cart_discount", "Promotion Discount")}</span>
                                    <span>-Ks {totalDiscount.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-bold text-orange-600 dark:border-slate-700 dark:text-orange-400">
                                <span>{t("checkout_confirm_total", "Total")}</span>
                                <span>Ks {totalPrice.toLocaleString()}</span>
                            </div>

                            <div className="mt-6 rounded-lg border-2 border-dashed border-slate-200 p-4 dark:border-slate-700">
                                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {t("checkout_upload_slip", "Upload transfer slip (screenshot)")}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData("payment_slip", e.target.files[0])}
                                    className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-500/15 dark:file:text-orange-300"
                                    required
                                />

                                {errors.payment_slip && (
                                    <p className="mt-1 text-xs text-red-500">{errors.payment_slip}</p>
                                )}
                            </div>

                            <button
                                onClick={handleOrder}
                                disabled={processing}
                                className={`mt-6 w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition ${processing ? "bg-slate-400 dark:bg-slate-600" : "bg-orange-600 hover:bg-orange-700 active:scale-95"}`}
                            >
                                {processing ? t("please_wait", "Please wait...") : t("checkout_submit_order", "Place order")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
