import { useForm, Head } from "@inertiajs/react";
import { useState } from "react";
import { LuMapPin } from "react-icons/lu";
import Swal from "sweetalert2";

export default function Checkout({ cartItems, user }) {
    // ၁။ စုစုပေါင်းဈေးနှုန်းကို တွက်မယ်
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
        // URL မှာ ဒေတာပါလာရင် အဲဒါကိုယူမယ်၊ မပါရင် user profile ကယူမယ်၊ နှစ်ခုလုံးမရှိရင် အလွတ်ထားမယ်
        phone: queryParams.get("phone") || user.phone || "",
        address: queryParams.get("address") || user.address || "",
        total_amount: totalPrice,
        payment_slip: null, // ပုံကတော့ User ကို ပြန်ရွေးခိုင်းရပါမယ် (Browser Security ကြောင့်ပါ)
    });

    const handleOrder = (e) => {
        e.preventDefault();

        if (!data.phone || !data.address) {
            Swal.fire({
                title: "သတိပြုရန်",
                text: "ဖုန်းနံပါတ်နှင့် လိပ်စာ ဖြည့်ပေးပါဗျာ",
                icon: "warning",
            });
            return;
        }

        if (!data.payment_slip) {
            Swal.fire({
                title: "သတိပြုရန်",
                text: "ငွေလွှဲပြေစာ (Screenshot) တင်ပေးပါဦးဗျ",
                icon: "warning",
            });
            return;
        }

        // ၃။ Route နာမည်ကို web.php ကအတိုင်း ပြန်စစ်ပါ (admin.orders.store ဖြစ်နိုင်ပါတယ်)
        post(route("checkout.confirm"), {
            forceFormData: true,
            onError: (err) => {
                // message ဒါမှမဟုတ် တခြား error တွေကို ရှာမယ်
                const systemError = err.message || err.system_error;
                const validationErrors = Object.values(err).flat().join("<br>");

                Swal.fire({
                    title: "မှားယွင်းမှုရှိပါသည်",
                    html: `<div class="text-left text-sm text-red-600">${systemError || validationErrors}</div>`,
                    icon: "error",
                    confirmButtonText: "ပြန်စစ်မည်",
                    confirmButtonColor: "#ea580c",
                });
            },
        });
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("ဒီ browser မှာ location feature မရပါ။");
            setLocationMessage("");
            return;
        }
        if (!window.isSecureContext) {
            setLocationError("Location ကိုအသုံးပြုရန် HTTPS (သို့) localhost မှ ဖွင့်ထားရပါမယ်။");
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
                        setLocationMessage("လက်ရှိတည်နေရာလိပ်စာကို ဖြည့်ပြီးပါပြီ။");
                    } catch {
                        setData("address", `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                        setLocationMessage("Coordinates ဖြင့် လိပ်စာဖြည့်ပြီးပါပြီ။");
                    } finally {
                        setLocating(false);
                    }
                },
                (error) => {
                    setLocating(false);
                    if (error?.code === 1) {
                        setLocationError("Location permission ပိတ်ထားပါတယ်။ Browser Site Settings မှာ Allow Location လုပ်ပြီး ပြန်စမ်းပါ။");
                        return;
                    }
                    if (error?.code === 2) {
                        setLocationError("လက်ရှိတည်နေရာ မရရှိပါ။ GPS/Network ကို စစ်ပြီး ပြန်စမ်းပါ။");
                        return;
                    }
                    if (error?.code === 3) {
                        setLocationError("တည်နေရာရယူချိန်ကျော်သွားပါတယ်။ ပြန်စမ်းပါ။");
                        return;
                    }
                    setLocationError("Location permission မရပါ (သို့) တည်နေရာ မရရှိပါ။");
                },
                { enableHighAccuracy: true, timeout: 18000, maximumAge: 0 },
            );
        };

        const promptThenRequest = () => {
            Swal.fire({
                title: "Location Access",
                text: "အနီးစပ်ဆုံးလိပ်စာကို အလိုအလျောက်ဖြည့်ရန် Location ကို Allow လုပ်ပေးပါ။",
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
                        setLocationError("Location permission ကို browser မှာ block လုပ်ထားပါတယ်။ Site Settings > Location > Allow ပြောင်းပြီး ပြန်စမ်းပါ။");
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
        <div className="bg-gray-100 min-h-screen pb-12">
            <Head title="Checkout" />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">
                    ငွေချေမည် (Checkout)
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* ဘယ်ဘက်: လိပ်စာနှင့် အချက်အလက် */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold text-lg mb-4 border-b pb-2 flex items-center">
                                <LuMapPin className="mr-2 h-4 w-4 text-orange-500" />
                                ပစ္စည်းပို့ဆောင်မည့် လိပ်စာ
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        ဖုန်းနံပါတ်
                                    </label>
                                    <input
                                        type="tel"
                                        pattern="[0-9]*"
                                        required
                                        className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none transition ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData("phone", e.target.value)
                                        }
                                        placeholder="၀၉xxxxxxxx"
                                    />
                                    {errors.phone && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        အိမ်အမှတ်၊ လမ်း၊ မြို့နယ်၊ မြို့
                                    </label>
                                    <textarea
                                        className={`w-full border rounded-lg p-2.5 h-24 focus:ring-2 focus:ring-orange-500 outline-none transition ${errors.address ? "border-red-500" : "border-gray-300"}`}
                                        value={data.address}
                                        onChange={(e) =>
                                            setData("address", e.target.value)
                                        }
                                        placeholder="ဥပမာ- အမှတ် (၁၂)၊ ဗဟိုလမ်း၊ ကမာရွတ်၊ ရန်ကုန်"
                                    />
                                    <div className="mt-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleUseCurrentLocation}
                                            disabled={locating}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${locating ? "bg-slate-400" : "bg-sky-600 hover:bg-sky-700"}`}
                                        >
                                            {locating ? "Locating..." : "Use Current Location"}
                                        </button>
                                        {locationMessage ? (
                                            <span className="text-xs font-medium text-emerald-700">{locationMessage}</span>
                                        ) : null}
                                    </div>
                                    {locationError ? (
                                        <p className="text-red-500 text-xs mt-1">{locationError}</p>
                                    ) : null}
                                    {errors.address && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ငွေပေးချေမှုပုံစံ */}
                        {/* ငွေပေးချေမှုပုံစံ - ပြင်ဆင်ရန် */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="font-bold text-lg mb-3 flex items-center">
                                <span className="mr-2">💳</span>{" "}
                                ငွေပေးချေမှုပုံစံ
                            </h2>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <p className="text-sm text-orange-800 font-bold mb-2">
                                    ဘဏ်အကောင့်သို့ ငွေကြိုတင်လွှဲပေးပါရန်
                                </p>
                                <div className="space-y-2 text-sm text-gray-700 bg-white p-3 rounded border border-orange-100">
                                    <div className="flex justify-between">
                                        <span>KPay / Wave:</span>
                                        <span className="font-bold">
                                            09 123 456 789
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span>Name:</span>
                                        <span className="font-bold">
                                            U Thurein Phyo
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-orange-600 mt-3 italic">
                                    * ငွေလွှဲပြီးပါက ပြေစာတင်ပေးပါရန်
                                    မေတ္တာရပ်ခံအပ်ပါသည်။
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ညာဘက်: အော်ဒါအနှစ်ချုပ် */}
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
                            <h2 className="font-bold border-b pb-2 mb-4 text-gray-800">
                                အော်ဒါအကျဉ်းချုပ်
                            </h2>
                            <div className="max-h-60 overflow-y-auto mb-4 pr-2">
                                {cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between text-sm mb-3"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-gray-700 font-medium truncate w-32">
                                                {item.product.name}
                                            </span>
                                            <span className="text-gray-400 text-xs">
                                                Qty: {item.quantity}
                                            </span>
                                        </div>
                                            <span className="text-gray-600">
                                                Ks{" "}
                                                {(
                                                    Number(
                                                        item.line_total ||
                                                            (item.effective_unit_price ||
                                                                item.variant
                                                                    ?.price ||
                                                                0) *
                                                                item.quantity,
                                                    )
                                            ).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            {totalDiscount > 0 && (
                                <div className="border-t pt-3 flex justify-between text-emerald-700 text-sm font-semibold">
                                    <span>Promotion Discount</span>
                                    <span>-Ks {totalDiscount.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="border-t pt-4 flex justify-between font-bold text-lg text-orange-600">
                                <span>စုစုပေါင်း</span>
                                <span>Ks {totalPrice.toLocaleString()}</span>
                            </div>

                            <div className="mt-6 p-4 border-2 border-dashed border-gray-200 rounded-lg">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    📸 ငွေလွှဲပြေစာ (Screenshot) တင်ပေးပါ
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setData(
                                            "payment_slip",
                                            e.target.files[0],
                                        )
                                    }
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                    required
                                />

                                {errors.payment_slip && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.payment_slip}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleOrder}
                                disabled={processing}
                                className={`w-full py-3.5 rounded-xl mt-6 font-bold text-white transition shadow-lg ${processing ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700 active:transform active:scale-95"}`}
                            >
                                {processing ? "ခဏစောင့်ပါ..." : "အော်ဒါတင်မည်"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
