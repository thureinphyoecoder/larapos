import { Link, usePage, router } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

export default function ProductDetail({ product, reviews = [], ratingSummary = {}, recommendations = [] }) {
    const page = usePage();
    const { auth, errors = {}, i18n = {}, locale = "mm" } = page.props;
    const t = (key, fallback) => i18n?.[key] || fallback;
    const isMM = String(locale).toLowerCase() === "mm";
    const [themeMode, setThemeMode] = useState("system");
    const [resolvedTheme, setResolvedTheme] = useState("light");
    const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
    const [quantity, setQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [localCartCount, setLocalCartCount] = useState(Number(auth?.cart_count || 0));

    useEffect(() => {
        setLocalCartCount(Number(auth?.cart_count || 0));
    }, [auth?.cart_count]);

    useEffect(() => {
        const saved = window.localStorage.getItem("larapee_theme_mode");
        if (saved === "light" || saved === "dark" || saved === "system") {
            setThemeMode(saved);
        }
    }, []);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const applyTheme = () => {
            const nextTheme = themeMode === "system" ? (media.matches ? "dark" : "light") : themeMode;
            setResolvedTheme(nextTheme);
            document.documentElement.dataset.theme = nextTheme;
            document.documentElement.classList.toggle("dark", nextTheme === "dark");
        };
        applyTheme();
        media.addEventListener("change", applyTheme);
        return () => media.removeEventListener("change", applyTheme);
    }, [themeMode]);

    useEffect(() => {
        window.localStorage.setItem("larapee_theme_mode", themeMode);
    }, [themeMode]);

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
                title: t("detail_select_variant_title", "Variant not selected"),
                text: t("detail_select_variant_text", "Please choose a variant before continuing."),
                icon: "warning",
                confirmButtonColor: "#f97316",
            });
            return;
        }

        if (!auth.user) {
            Swal.fire({
                title: t("detail_login_required_title", "Please login first"),
                text: t("detail_login_required_text", "Login is required to continue this action."),
                icon: "info",
                showCancelButton: true,
                confirmButtonText: t("detail_login_cta", "Go to Login"),
                cancelButtonText: t("detail_login_cancel", "Cancel"),
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
                    router.reload({
                        only: ["auth"],
                        preserveScroll: true,
                    });

                    Swal.fire({
                        icon: "success",
                        title: t("detail_add_cart_success", "Added to cart"),
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
                            title: t("detail_action_failed_title", "Action failed"),
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
        <div className="min-h-screen bg-slate-100 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/88">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
                    <div className="flex items-center gap-2 min-w-0">
                        <Link href="/" className="font-medium transition hover:text-orange-500 dark:hover:text-orange-400">
                            Back
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">/</span>
                        <Link href="/" className="font-medium transition hover:text-orange-500 dark:hover:text-orange-400">
                            Home
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">/</span>
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-100">{product.name}</span>
                    </div>
                    <Link
                        href={auth?.user ? route("cart.index") : route("login")}
                        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        aria-label="Cart"
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
                                strokeWidth={1.9}
                                d="M3 4h2l2.2 10.5a1 1 0 00.98.8h8.92a1 1 0 00.98-.8L21 7H8"
                            />
                            <circle cx="10" cy="19" r="1.5" />
                            <circle cx="18" cy="19" r="1.5" />
                        </svg>
                        {localCartCount > 0 && (
                            <span className="absolute -right-1 -top-1 rounded-full bg-orange-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
                                {localCartCount > 99 ? "99+" : localCartCount}
                            </span>
                        )}
                    </Link>
                    <button
                        type="button"
                        onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        aria-label={t("theme_toggle", "Toggle theme")}
                        title={t("theme_toggle", "Toggle theme")}
                    >
                        {resolvedTheme === "dark" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 18a6 6 0 100-12 6 6 0 000 12zm0 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm0-22a1 1 0 011 1v1a1 1 0 11-2 0V1a1 1 0 011-1zm11 11a1 1 0 010 2h-1a1 1 0 110-2h1zM3 12a1 1 0 010 2H2a1 1 0 110-2h1zm16.95 7.536a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM5.17 5.17a1 1 0 010 1.415l-.707.707A1 1 0 113.05 5.878l.707-.707a1 1 0 011.414 0zm14.78 0l.707.708a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 011.414-1.415zM5.17 18.83l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 111.414-1.414z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21.75 15.002A9.75 9.75 0 1112.998 2.25a.75.75 0 01.674 1.08A8.25 8.25 0 0020.67 10.33a.75.75 0 011.08.672z" />
                            </svg>
                        )}
                    </button>
                </div>
            </nav>

            <div className="mx-auto mt-8 max-w-6xl space-y-8 px-4">
                <div className="grid grid-cols-1 gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-2">
                    <div className="space-y-4">
                        <div className="aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
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
                                        : "border-slate-200 hover:border-orange-300 dark:border-slate-700"
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
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                {product.brand?.name || "Brand"}
                            </p>
                            <h1 className="mt-2 text-3xl font-black leading-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
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
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {totalRatings} ratings
                                </p>
                                {totalRatings >= 5 && (
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Trusted by buyers
                                    </span>
                                )}
                            </div>
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">SKU: {selectedVariant?.sku || product.sku || "-"}</p>
                        </div>

                        {errors.message && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
                                {errors.message}
                            </div>
                        )}

                        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-500/30 dark:bg-orange-500/10">
                            <div className="flex flex-wrap items-end gap-2">
                                <span className="text-3xl font-black text-orange-600">Ks {selectedPrice.toLocaleString()}</span>
                                {selectedDiscountPerUnit > 0 && (
                                    <span className="text-sm text-slate-400 line-through dark:text-slate-500">Ks {selectedBasePrice.toLocaleString()}</span>
                                )}
                                {selectedVariant?.promotion?.label && (
                                    <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase text-rose-700">
                                        {selectedVariant.promotion.label}
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Stock: {selectedVariant?.stock_level ?? 0}</p>
                            {selectedDiscountPerUnit > 0 && (
                                <p className="text-xs font-semibold text-emerald-700 mt-1">
                                    You save Ks {(selectedDiscountPerUnit * quantity).toLocaleString()}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Choose Variant</p>
                            <div className="flex flex-wrap gap-2">
                                {(product.variants || []).map((v) => (
                                    <button
                                        type="button"
                                        key={v.id}
                                        onClick={() => setSelectedVariant(v)}
                                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                                            selectedVariant?.id === v.id
                                                ? "border-orange-500 text-orange-600 bg-orange-50"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        {v.sku?.split("-").pop() || "Default"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Qty</span>
                            <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="border-r border-slate-300 bg-slate-100 px-3 py-2 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                                >
                                    -
                                </button>
                                <span className="px-6 py-2 font-semibold text-slate-700 dark:text-slate-200">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="border-l border-slate-300 bg-slate-100 px-3 py-2 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
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
                                {processing ? t("detail_added_loading", "Adding...") : t("detail_add_to_cart", "Add to Cart")}
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
                            <p className="text-sm font-medium text-red-500">This variant is out of stock.</p>
                        )}
                    </div>
                </div>

                <ProductTabs
                    product={product}
                    description={product.description}
                    reviews={reviews}
                    ratingSummary={ratingSummary}
                    auth={auth}
                    isMM={isMM}
                    t={t}
                />

                {recommendations.length > 0 && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Recommended for You</h2>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Based on this product and buyer behavior</p>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {recommendations.map((item) => (
                                <Link
                                    key={item.id}
                                    href={route("product.show", { slug: item.slug })}
                                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <img src={item.image_url || "/images/products/product-1.svg"} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                    </div>
                                    <div className="p-3">
                                        <p className="line-clamp-2 min-h-[40px] text-sm font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{item.shop?.name || "LaraPee Store"}</p>
                                        <p className="mt-2 text-sm font-black text-orange-600">Ks {Number(item.price || 0).toLocaleString()}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

function ProductTabs({ product, description, reviews = [], ratingSummary = {}, auth, isMM, t }) {
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
            title: t("detail_login_required_title", "Please login first"),
            text: t("detail_comment_login_text", "Please login to add comments or ratings."),
            icon: "info",
            showCancelButton: true,
            confirmButtonText: t("detail_login_cta", "Go to Login"),
            cancelButtonText: t("detail_login_cancel", "Cancel"),
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex gap-6 overflow-x-auto border-b border-slate-100 dark:border-slate-800">
                {["description", "comments", "ratings"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition whitespace-nowrap ${
                            activeTab === tab
                                ? "border-b-2 border-orange-500 text-orange-600"
                                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
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
                            <div className="prose max-w-none whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
                                {normalizedDescription}
                            </div>
                        )}
                        {!hasDescription && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Product summary will appear here when seller adds description details.
                            </div>
                        )}
                        {detailSections.map((section) => (
                            <div key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{section.title}</h3>
                                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
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
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Brand</p>
                                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-100">{product?.brand?.name || "-"}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Category</p>
                                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-100">{product?.category?.name || "-"}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Shop</p>
                                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-100">{product?.shop?.name || "-"}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Variants</p>
                                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-100">{product?.variants?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "comments" && (
                    <div className="space-y-4">
                        <p className="text-sm italic text-slate-500 dark:text-slate-400">Comments ({commentList.length})</p>

                        <form onSubmit={submitComment} className="space-y-3">
                            <textarea
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                placeholder={isMM ? "မေးချင်တာရှိရင် ရေးခဲ့ပါ..." : "Write your comment..."}
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
                                {submittingComment ? t("detail_posting", "Posting...") : t("detail_post_comment", "Post Comment")}
                            </button>
                        </form>

                        <div className="space-y-3 pt-2">
                            {commentList.length ? (
                                commentList.map((c) => (
                                    <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{c.reviewer_name}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">{c.created_at_human || "recent"}</p>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{c.comment}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500">No comments yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "ratings" && (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center py-4">
                            <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">{averageRating.toFixed(1)}</span>
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
                            <p className="text-sm text-slate-400 dark:text-slate-500">{ratingCount} ratings</p>
                        </div>

                        <form onSubmit={submitRating} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Give your rating</p>
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
                                {submittingRating ? t("detail_submitting", "Submitting...") : t("detail_submit_rating", "Submit Rating")}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
