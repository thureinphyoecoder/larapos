import { Link, usePage, router } from "@inertiajs/react"; // 👈 router ထည့်ပါ
import { useState } from "react";
import Swal from "sweetalert2";

export default function ProductDetail({ product }) {
    const { auth, errors = {} } = usePage().props; // 👈 props ထဲက auth ကို တန်းယူလိုက်ပါ
    const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
    const [quantity, setQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);

    const handleAction = (e, type) => {
        e.preventDefault();

        // ၁။ Auth အရင်စစ်မယ်
        if (!auth.user) {
            Swal.fire({
                title: "Login ဝင်ပေးပါဦး",
                text: "ပစ္စည်းဝယ်ယူရန်အတွက် အရင်ဆုံး Login ဝင်ပေးဖို့ လိုပါတယ်ဗျာ။",
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Login သို့သွားမည်",
                cancelButtonText: "နေဦးမယ်",
                confirmButtonColor: "#f97316",
            }).then((result) => {
                if (result.isConfirmed) router.get("/login");
            });
            return;
        }

        // ၂။ Login ရှိရင် ဒေတာပို့မယ်
        const redirectTo =
            type === "buy_now" ? route("checkout.index") : null;

        router.post(
            route("cart.add"),
            {
                product_id: product.id,
                variant_id: selectedVariant?.id,
                quantity,
                redirect_to: redirectTo,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    if (type !== "buy_now") {
                        Swal.fire({
                            icon: "success",
                            title: "ခြင်းတောင်းထဲ ထည့်ပြီးပါပြီ",
                            toast: true,
                            position: "top-end",
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                        });
                    }
                },
            },
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <nav className="bg-white border-b mb-6">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center text-sm gap-2">
                    <Link
                        href="/"
                        className="text-gray-500 hover:text-orange-500 transition font-medium"
                    >
                        🏠 Home
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-800 font-medium truncate">
                        {product.name}
                    </span>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 mt-8">
                <div className="bg-white rounded-sm shadow-sm p-8 flex flex-col md:flex-row gap-10">
                    {/* Left: Product Image */}
                    <div className="md:w-2/5">
                        <div className="aspect-square bg-gray-100 rounded-sm flex items-center justify-center border border-gray-200 shadow-inner">
                            <span className="text-gray-300 text-6xl font-bold uppercase">
                                {product.brand?.name}
                            </span>
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="md:w-3/5">
                        <h1 className="text-2xl font-semibold mb-4">
                            {product.name}
                        </h1>

                        {/* Error Message ပေါ်ဖို့ (ဥပမာ- Login မဝင်ထားရင်) */}
                        {errors.message && (
                            <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
                                ⚠️ {errors.message}
                            </div>
                        )}

                        <div className="bg-orange-50 p-5 rounded-sm mb-6">
                            <span className="text-3xl font-bold text-orange-600">
                                Ks{" "}
                                {(
                                    selectedVariant?.price * quantity
                                ).toLocaleString()}
                            </span>
                        </div>

                        {/* Variants Selector */}
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-2">
                                Variant ရွေးချယ်ပါ
                            </p>
                            <div className="flex gap-2">
                                {product.variants.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVariant(v)}
                                        className={`px-4 py-2 border text-sm ${selectedVariant.id === v.id ? "border-orange-500 text-orange-500 bg-orange-50" : "border-gray-200"}`}
                                    >
                                        {v.sku.split("-").pop()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="mb-8 flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                                အရေအတွက်
                            </span>
                            <div className="flex items-center border border-gray-300">
                                <button
                                    onClick={() =>
                                        setQuantity((q) => Math.max(1, q - 1))
                                    }
                                    className="px-3 py-1 bg-gray-100 border-r"
                                >
                                    -
                                </button>
                                <span className="px-6 py-1">{quantity}</span>
                                <button
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="px-3 py-1 bg-gray-100 border-l"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="flex gap-4">
                            <button
                                onClick={(e) => handleAction(e, "add_to_cart")}
                                disabled={processing}
                                className={`flex-1 py-4 rounded-sm font-bold flex items-center justify-center gap-2 transition ${processing ? "bg-gray-400" : "bg-orange-100 text-orange-600 border border-orange-500 hover:bg-orange-200"}`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                {processing
                                    ? "ထည့်သွင်းနေပါသည်..."
                                    : "ခြင်းတောင်းထဲထည့်မည်"}
                            </button>

                            <button
                                onClick={(e) => handleAction(e, "buy_now")}
                                disabled={processing}
                                className={`flex-1 py-4 rounded-sm font-bold shadow-md ${processing ? "bg-gray-400 text-white" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                            >
                                အခုဝယ်မည်
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ProductTabs
                description={product.description}
                reviews={product.reviews}
            />
        </div>
    );
}

// ProductDetail.jsx ရဲ့ အောက်ဆုံးမှာ သီးသန့် Component တစ်ခုအနေနဲ့ ထည့်ပါ
function ProductTabs({ description, reviews = [] }) {
    const [activeTab, setActiveTab] = useState("description");

    return (
        <div className="mt-10 bg-white p-6 shadow-sm rounded-sm border border-gray-100">
            {/* Tab Headers */}
            <div className="flex border-b gap-8 mb-6">
                {["description", "comments", "ratings"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition ${
                            activeTab === tab
                                ? "border-b-2 border-orange-500 text-orange-600"
                                : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
                {activeTab === "description" && (
                    <div className="prose max-w-none text-gray-600 leading-relaxed">
                        {description ||
                            "ဒီပစ္စည်းအတွက် အသေးစိတ်ဖော်ပြချက် မရှိသေးပါဘူး။"}
                    </div>
                )}

                {activeTab === "comments" && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 italic">
                            မှတ်ချက်များ (၀)
                        </p>
                        {/* ဒီမှာ Comment Form နဲ့ List ထည့်လို့ရပါတယ် */}
                        <textarea
                            className="w-full border p-3 text-sm"
                            placeholder="မေးချင်တာရှိရင် ရေးခဲ့ပါ..."
                        ></textarea>
                    </div>
                )}

                {activeTab === "ratings" && (
                    <div className="flex flex-col items-center py-10">
                        <span className="text-4xl font-bold text-gray-800">
                            0.0
                        </span>
                        <div className="flex text-yellow-400 my-2">
                            ⭐⭐⭐⭐⭐
                        </div>
                        <p className="text-gray-400 text-sm">
                            သုံးသပ်ချက် မရှိသေးပါ
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
