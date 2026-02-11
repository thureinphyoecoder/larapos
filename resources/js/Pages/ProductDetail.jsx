import { Link, usePage, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import Swal from "sweetalert2";

export default function ProductDetail({ product, reviews = [], ratingSummary = {} }) {
    const { auth, errors = {} } = usePage().props;
    const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
    const [quantity, setQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);

    const selectedEffectiveUnitPrice = Number(selectedVariant?.effective_price ?? selectedVariant?.price ?? 0);
    const selectedBaseUnitPrice = Number(selectedVariant?.base_price ?? selectedVariant?.price ?? 0);
    const selectedDiscountPerUnit = Math.max(0, selectedBaseUnitPrice - selectedEffectiveUnitPrice);
    const selectedPrice = selectedEffectiveUnitPrice * quantity;
    const selectedBasePrice = selectedBaseUnitPrice * quantity;
    const inStock = Number(selectedVariant?.stock_level || 0) > 0;
    const avgRating = Number(ratingSummary?.average || 0);
    const totalRatings = Number(ratingSummary?.count || 0);

    const getProductImage = () => {
        if (product?.image) return product.image;
        if (product?.image_url) return product.image_url;
        if (product?.image_path) return `/storage/${product.image_path}`;
        return "/images/products/product-1.svg";
    };

    const galleryImages = [
        getProductImage(),
        "/images/products/angle-1.svg",
        "/images/products/angle-2.svg",
        "/images/products/angle-3.svg",
    ];
    const [selectedImage, setSelectedImage] = useState(galleryImages[0]);

    const handleAction = (e, type) => {
        e.preventDefault();

        if (!selectedVariant) {
            Swal.fire({
                title: "Variant မရွေးရသေးပါ",
                text: "ဝယ်ယူမည့် variant ကိုအရင်ရွေးပေးပါ။",
                icon: "warning",
                confirmButtonColor: "#f97316",
            });
            return;
        }

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

        router.post(
            route("cart.add"),
            {
                product_id: product.id,
                variant_id: selectedVariant?.id,
                quantity,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    if (type === "buy_now") {
                        router.visit(route("checkout.index"));
                        return;
                    }

                    Swal.fire({
                        icon: "success",
                        title: "ခြင်းတောင်းထဲ ထည့်ပြီးပါပြီ",
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true,
                    });
                },
                onError: (formErrors) => {
                    const firstError = Object.values(formErrors || {}).find((value) => typeof value === "string");
                    if (firstError) {
                        Swal.fire({
                            title: "လုပ်ဆောင်မှု မအောင်မြင်ပါ",
                            text: firstError,
                            icon: "error",
                            confirmButtonColor: "#f97316",
                        });
                    }
                },
            },
        );
    };

    return (
        <div className="bg-slate-100 min-h-screen pb-12">
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 backdrop-blur">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center text-sm gap-2 text-slate-500">
                    <Link href="/" className="hover:text-orange-500 transition font-medium">
                        Home
                    </Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-800 font-semibold truncate">{product.name}</span>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="aspect-square rounded-3xl overflow-hidden border border-slate-200 bg-slate-100">
                            <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {galleryImages.slice(1).map((img, idx) => (
                                <button
                                    key={img}
                                    type="button"
                                    onClick={() => setSelectedImage(img)}
                                    className={`h-20 rounded-xl overflow-hidden border transition ${
                                        selectedImage === img
                                            ? "border-orange-500 ring-2 ring-orange-200"
                                            : "border-slate-200 hover:border-orange-300"
                                    }`}
                                    aria-label={`View angle ${idx + 1}`}
                                >
                                    <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">
                                {product.brand?.name || "Brand"}
                            </p>
                            <h1 className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                                {product.name}
                            </h1>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                                    {"★★★★★".split("").map((star, idx) => (
                                        <span
                                            key={idx}
                                            className={idx < Math.round(avgRating) ? "text-amber-500" : "text-slate-300"}
                                        >
                                            {star}
                                        </span>
                                    ))}
                                    <span className="text-sm font-semibold text-slate-700 ms-1">
                                        {avgRating.toFixed(1)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">
                                    {totalRatings} ratings
                                </p>
                                {totalRatings >= 5 && (
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Trusted by buyers
                                    </span>
                                )}
                            </div>
                            <p className="mt-3 text-sm text-slate-500">SKU: {selectedVariant?.sku || product.sku || "-"}</p>
                        </div>

                        {errors.message && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {errors.message}
                            </div>
                        )}

                        <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl">
                            <div className="flex flex-wrap items-end gap-2">
                                <span className="text-3xl font-black text-orange-600">Ks {selectedPrice.toLocaleString()}</span>
                                {selectedDiscountPerUnit > 0 && (
                                    <span className="text-sm text-slate-400 line-through">Ks {selectedBasePrice.toLocaleString()}</span>
                                )}
                                {selectedVariant?.promotion?.label && (
                                    <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase text-rose-700">
                                        {selectedVariant.promotion.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Stock: {selectedVariant?.stock_level ?? 0}</p>
                            {selectedDiscountPerUnit > 0 && (
                                <p className="text-xs font-semibold text-emerald-700 mt-1">
                                    You save Ks {(selectedDiscountPerUnit * quantity).toLocaleString()}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-slate-700 mb-3">Choose Variant</p>
                            <div className="flex flex-wrap gap-2">
                                {(product.variants || []).map((v) => (
                                    <button
                                        type="button"
                                        key={v.id}
                                        onClick={() => setSelectedVariant(v)}
                                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                                            selectedVariant?.id === v.id
                                                ? "border-orange-500 text-orange-600 bg-orange-50"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        {v.sku?.split("-").pop() || "Default"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-slate-700">Qty</span>
                            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="px-3 py-2 bg-slate-100 border-r border-slate-300 hover:bg-slate-200"
                                >
                                    -
                                </button>
                                <span className="px-6 py-2 font-semibold text-slate-700">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="px-3 py-2 bg-slate-100 border-l border-slate-300 hover:bg-slate-200"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={(e) => handleAction(e, "add_to_cart")}
                                disabled={processing || !inStock}
                                className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition ${
                                    processing || !inStock
                                        ? "bg-slate-300 text-slate-500"
                                        : "bg-orange-100 text-orange-600 border border-orange-500 hover:bg-orange-200"
                                }`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
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
                                {processing ? "ထည့်သွင်းနေပါသည်..." : "Add to Cart"}
                            </button>

                            <button
                                type="button"
                                onClick={(e) => handleAction(e, "buy_now")}
                                disabled={processing || !inStock}
                                className={`py-3 rounded-2xl font-bold shadow-md transition ${
                                    processing || !inStock
                                        ? "bg-slate-300 text-slate-500"
                                        : "bg-orange-600 text-white hover:bg-orange-700"
                                }`}
                            >
                                Buy Now
                            </button>
                        </div>

                        {!inStock && (
                            <p className="text-sm text-red-500 font-medium">This variant is out of stock.</p>
                        )}
                    </div>
                </div>

                <ProductTabs
                    product={product}
                    description={product.description}
                    reviews={reviews}
                    ratingSummary={ratingSummary}
                    auth={auth}
                />
            </div>
        </div>
    );
}

function ProductTabs({ product, description, reviews = [], ratingSummary = {}, auth }) {
    const [activeTab, setActiveTab] = useState("description");
    const [commentText, setCommentText] = useState("");
    const [ratingInput, setRatingInput] = useState(0);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [submittingRating, setSubmittingRating] = useState(false);

    const commentList = useMemo(
        () => reviews.filter((review) => review.comment && String(review.comment).trim() !== ""),
        [reviews],
    );

    const averageRating = Number(ratingSummary?.average || 0);
    const ratingCount = Number(ratingSummary?.count || 0);
    const normalizedDescription = String(description || "").trim();
    const hasDescription = normalizedDescription.length > 0;
    const detailSections = [
        {
            title: "Product Highlights",
            items: [
                "Authentic quality with premium finish",
                "Carefully selected for daily personal and professional use",
                "Stable performance and long-term durability",
                "Easy to use with clean and practical design",
            ],
        },
        {
            title: "Specifications",
            items: [
                `Brand: ${product?.brand?.name || "-"}`,
                `Category: ${product?.category?.name || "-"}`,
                `Shop: ${product?.shop?.name || "-"}`,
                `Available Variants: ${product?.variants?.length || 0}`,
            ],
        },
        {
            title: "Shipping & Warranty",
            items: [
                "Fast delivery service depending on customer location",
                "Secure packaging to prevent transport damage",
                "Customer support available for post-purchase issues",
                "Warranty eligibility depends on product and seller policy",
            ],
        },
    ];

    const ensureAuth = () => {
        if (auth?.user) return true;

        Swal.fire({
            title: "Login ဝင်ပေးပါဦး",
            text: "Comment / Rating ပေးရန် Login လိုအပ်ပါတယ်။",
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Login",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#f97316",
        }).then((result) => {
            if (result.isConfirmed) router.get("/login");
        });

        return false;
    };

    const submitComment = (e) => {
        e.preventDefault();
        if (!ensureAuth()) return;

        const text = commentText.trim();
        if (!text) return;

        router.post(
            route("products.reviews.store", product.id),
            { comment: text },
            {
                preserveScroll: true,
                onStart: () => setSubmittingComment(true),
                onFinish: () => setSubmittingComment(false),
                onSuccess: () => setCommentText(""),
            },
        );
    };

    const submitRating = (e) => {
        e.preventDefault();
        if (!ensureAuth()) return;
        if (ratingInput < 1 || ratingInput > 5) return;

        router.post(
            route("products.reviews.store", product.id),
            { rating: ratingInput },
            {
                preserveScroll: true,
                onStart: () => setSubmittingRating(true),
                onFinish: () => setSubmittingRating(false),
                onSuccess: () => setRatingInput(0),
            },
        );
    };

    return (
        <div className="bg-white p-6 sm:p-8 shadow-sm rounded-3xl border border-slate-200">
            <div className="flex border-b border-slate-100 gap-6 mb-6 overflow-x-auto">
                {["description", "comments", "ratings"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition whitespace-nowrap ${
                            activeTab === tab
                                ? "border-b-2 border-orange-500 text-orange-600"
                                : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="min-h-[220px]">
                {activeTab === "description" && (
                    <div className="space-y-4">
                        {hasDescription && (
                            <div className="prose max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                                {normalizedDescription}
                            </div>
                        )}
                        {!hasDescription && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                Product summary will appear here when seller adds description details.
                            </div>
                        )}
                        {detailSections.map((section) => (
                            <div key={section.title} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                                <h3 className="text-sm font-bold text-slate-800">{section.title}</h3>
                                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                                    {section.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2">
                                            <span className="mt-1 text-orange-500">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="text-slate-400 text-xs uppercase">Brand</p>
                                <p className="font-semibold text-slate-700 mt-1">{product?.brand?.name || "-"}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="text-slate-400 text-xs uppercase">Category</p>
                                <p className="font-semibold text-slate-700 mt-1">{product?.category?.name || "-"}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="text-slate-400 text-xs uppercase">Shop</p>
                                <p className="font-semibold text-slate-700 mt-1">{product?.shop?.name || "-"}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="text-slate-400 text-xs uppercase">Variants</p>
                                <p className="font-semibold text-slate-700 mt-1">{product?.variants?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "comments" && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 italic">Comments ({commentList.length})</p>

                        <form onSubmit={submitComment} className="space-y-3">
                            <textarea
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="မေးချင်တာရှိရင် ရေးခဲ့ပါ..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            ></textarea>
                            <button
                                type="submit"
                                disabled={submittingComment || commentText.trim().length < 2}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                                    submittingComment || commentText.trim().length < 2
                                        ? "bg-slate-300 text-slate-500"
                                        : "bg-orange-600 text-white hover:bg-orange-700"
                                }`}
                            >
                                {submittingComment ? "Posting..." : "Post Comment"}
                            </button>
                        </form>

                        <div className="space-y-3 pt-2">
                            {commentList.length ? (
                                commentList.map((c) => (
                                    <div key={c.id} className="p-3 rounded-xl border border-slate-200 bg-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-semibold text-sm text-slate-700">{c.reviewer_name}</p>
                                            <p className="text-xs text-slate-400">{c.created_at_human || "recent"}</p>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-600">{c.comment}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400">No comments yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "ratings" && (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center py-4">
                            <span className="text-4xl font-bold text-slate-800">{averageRating.toFixed(1)}</span>
                            <div className="flex text-yellow-400 my-2 text-xl">
                                {"★★★★★".split("").map((star, idx) => (
                                    <span
                                        key={idx}
                                        className={idx < Math.round(averageRating) ? "text-yellow-400" : "text-slate-300"}
                                    >
                                        {star}
                                    </span>
                                ))}
                            </div>
                            <p className="text-slate-400 text-sm">{ratingCount} ratings</p>
                        </div>

                        <form onSubmit={submitRating} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <p className="text-sm font-semibold text-slate-700 mb-3">Give your rating</p>
                            <div className="flex items-center gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRatingInput(star)}
                                        className={`text-2xl ${star <= ratingInput ? "text-yellow-400" : "text-slate-300"}`}
                                        aria-label={`Rate ${star}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <button
                                type="submit"
                                disabled={submittingRating || !ratingInput}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                                    submittingRating || !ratingInput
                                        ? "bg-slate-300 text-slate-500"
                                        : "bg-orange-600 text-white hover:bg-orange-700"
                                }`}
                            >
                                {submittingRating ? "Submitting..." : "Submit Rating"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
