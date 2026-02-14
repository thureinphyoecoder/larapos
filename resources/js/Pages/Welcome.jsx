import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import LocaleSwitcher from "@/Components/LocaleSwitcher";

function priceMeta(product) {
    const variants = product?.variants || [];
    const variantPrices = variants
        .map((v) => {
            const base = Number(v?.base_price ?? v?.price ?? 0);
            const effective = Number(v?.effective_price ?? v?.price ?? 0);
            return {
                base,
                effective,
                hasDiscount: effective > 0 && base > 0 && effective < base,
                promotionType: v?.promotion?.type || null,
            };
        })
        .filter((row) => row.effective > 0);

    const cheapest = variantPrices.length
        ? variantPrices.reduce((min, row) => (row.effective < min.effective ? row : min), variantPrices[0])
        : null;

    const base = cheapest
        ? cheapest.base
        : Number(product?.base_price ?? product?.price ?? 0);
    const effective = cheapest
        ? cheapest.effective
        : Number(product?.price ?? 0);
    const hasDiscount = variantPrices.length
        ? variantPrices.some((row) => row.hasDiscount)
        : effective < base;
    const flashSale = variantPrices.some(
        (row) => row.promotionType === "flash_sale" && row.hasDiscount,
    );

    return {
        base,
        effective,
        hasDiscount,
        flashSale,
    };
}

export default function Welcome({
    products = [],
    categories = [],
    filters = {},
    auth,
}) {
    const page = usePage();
    const i18n = page.props?.i18n || {};
    const t = (key, fallback) => i18n?.[key] || fallback;

    const [search, setSearch] = useState(filters?.search || "");
    const [activeCategory, setActiveCategory] = useState(
        filters?.category ? String(filters.category) : "",
    );
    const [activeSlide, setActiveSlide] = useState(0);
    const [pauseSlider, setPauseSlider] = useState(false);
    const [showFlashModal, setShowFlashModal] = useState(false);
    const touchStartX = useRef(null);
    const cartCount = Number(auth?.cart_count || 0);

    const sliderItems = useMemo(() => {
        const heroProducts = products.filter((product) => Boolean(product?.is_hero));
        const regularProducts = products.filter((product) => !Boolean(product?.is_hero));
        const top = [...heroProducts, ...regularProducts].slice(0, 4);
        if (top.length) return top;
        return [
            { id: "s1", name: "Smart Electronics", brand: { name: "Tech" }, slug: null },
            { id: "s2", name: "Fashion Collection", brand: { name: "Style" }, slug: null },
            { id: "s3", name: "Home Essentials", brand: { name: "Living" }, slug: null },
        ];
    }, [products]);

    const slideBackgrounds = [
        "from-orange-600 via-amber-500 to-yellow-400",
        "from-cyan-700 via-sky-600 to-emerald-400",
        "from-rose-700 via-red-600 to-orange-500",
        "from-indigo-700 via-violet-600 to-fuchsia-500",
    ];

    const slideImages = [
        "/images/heroes/hero-tech.svg",
        "/images/heroes/hero-fashion.svg",
        "/images/heroes/hero-lifestyle.svg",
        "/images/heroes/hero-store.svg",
    ];

    const filterByCategory = (id) => {
        const nextCategory = id ? String(id) : "";
        setActiveCategory(nextCategory);
    };

    useEffect(() => {
        if (pauseSlider || sliderItems.length <= 1) return;

        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % sliderItems.length);
        }, 4500);

        return () => clearInterval(timer);
    }, [pauseSlider, sliderItems.length]);

    useEffect(() => {
        if (activeSlide >= sliderItems.length) {
            setActiveSlide(0);
        }
    }, [activeSlide, sliderItems.length]);

    const activeItem = sliderItems[activeSlide] || sliderItems[0];
    const activeSlideImage = slideImages[activeSlide % slideImages.length];

    const filteredProducts = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return products.filter((product) => {
            const matchCategory = activeCategory
                ? String(product?.category_id) === activeCategory
                : true;

            if (!matchCategory) return false;
            if (!keyword) return true;

            const name = String(product?.name || "").toLowerCase();
            const brand = String(product?.brand?.name || "").toLowerCase();
            const shop = String(product?.shop?.name || "").toLowerCase();

            return name.includes(keyword) || brand.includes(keyword) || shop.includes(keyword);
        });
    }, [products, search, activeCategory]);

    const flashSaleProducts = useMemo(
        () =>
            products
                .filter((product) => {
                    const price = priceMeta(product);
                    return price.flashSale && price.hasDiscount;
                })
                .slice(0, 10),
        [products],
    );

    const aiRecommendations = useMemo(() => {
        const pivot = activeItem || products[0];
        if (!pivot) return [];
        const pivotPrice = Number(priceMeta(pivot).effective || 0);
        const tokens = String(pivot?.name || "")
            .toLowerCase()
            .split(/\s+/)
            .filter((token) => token.length >= 3);

        return [...products]
            .filter((item) => item.id !== pivot.id)
            .map((item) => {
                const itemPrice = Number(priceMeta(item).effective || 0);
                const priceDistance = pivotPrice > 0 ? Math.min(Math.abs(itemPrice - pivotPrice) / pivotPrice, 1) : 1;
                const keywordBoost = tokens.filter((token) => String(item?.name || "").toLowerCase().includes(token)).length;
                let score = 0;
                score += Number(item?.category_id === pivot?.category_id) * 45;
                score += Number(item?.brand?.id === pivot?.brand?.id) * 30;
                score += Number(item?.shop?.id === pivot?.shop?.id) * 15;
                score += Math.round((1 - priceDistance) * 20);
                score += Math.min(10, keywordBoost * 3);
                score += Number(item?.variants?.[0]?.stock_level > 0) * 5;

                return { item, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((entry) => entry.item);
    }, [activeItem, products]);

    useEffect(() => {
        if (flashSaleProducts.length === 0) {
            setShowFlashModal(false);
            return;
        }

        if (typeof window === "undefined") {
            setShowFlashModal(true);
            return;
        }

        const key = `flash-sale:${flashSaleProducts.map((item) => item.id).join("-")}`;
        if (window.sessionStorage.getItem(key) === "1") {
            return;
        }

        window.sessionStorage.setItem(key, "1");
        setShowFlashModal(true);
    }, [flashSaleProducts]);

    const getProductImage = (product) => {
        if (product?.image) return product.image;
        if (product?.image_url) return product.image_url;
        if (product?.thumbnail) return product.thumbnail;

        const fallbackIndex = ((Number(product?.id) || 1) % 4) + 1;
        return `/images/products/product-${fallbackIndex}.svg`;
    };

    return (
        <div
            className="premium-shell min-h-screen bg-transparent"
        >
            <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:gap-5">
                        <Link href="/" className="shrink-0 text-2xl font-black tracking-tight text-orange-600 sm:text-4xl">
                            LaraPee
                        </Link>

                        <div className="order-3 w-full lg:order-none lg:min-w-[280px] lg:flex-1">
                            <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 text-slate-800 focus:outline-none"
                                    placeholder={t("search_placeholder", "Search products, brands or shops...")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="bg-orange-600 px-5 text-white transition hover:bg-orange-700"
                                    aria-label="Search"
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
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="ml-auto flex w-auto items-center gap-3 text-xs font-semibold text-slate-600 sm:text-sm">
                            {auth?.user ? (
                                <>
                                    <Link
                                        href={route("cart.index")}
                                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
                                    >
                                        <span>Cart</span>
                                        <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs font-black text-white">
                                            {cartCount}
                                        </span>
                                    </Link>
                                    <Link href={route("dashboard")} className="flex items-center gap-2 text-slate-700">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
                                            {auth.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="hidden md:inline">{t("hi", "Hi")}, {auth.user.name}</span>
                                    </Link>
                                    <span className="h-4 w-px bg-slate-300" />
                                    <Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                        className="transition hover:text-red-500"
                                    >
                                        {t("logout", "Logout")}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="transition hover:text-orange-600">
                                        {t("login", "Login")}
                                    </Link>
                                    <span className="h-4 w-px bg-slate-300" />
                                    <Link href="/register" className="transition hover:text-orange-600">
                                        {t("register", "Register")}
                                    </Link>
                                </>
                            )}
                            <span className="hidden h-4 w-px bg-slate-300 md:block" />
                            <LocaleSwitcher />
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <section
                    onMouseEnter={() => setPauseSlider(true)}
                    onMouseLeave={() => setPauseSlider(false)}
                    onTouchStart={(event) => {
                        touchStartX.current = event.changedTouches?.[0]?.clientX ?? null;
                    }}
                    onTouchEnd={(event) => {
                        if (!sliderItems.length) return;
                        const start = touchStartX.current;
                        const end = event.changedTouches?.[0]?.clientX ?? null;
                        if (start === null || end === null) return;
                        const delta = start - end;
                        if (Math.abs(delta) < 28) return;
                        if (delta > 0) {
                            setActiveSlide((prev) => (prev + 1) % sliderItems.length);
                        } else {
                            setActiveSlide((prev) => (prev - 1 + sliderItems.length) % sliderItems.length);
                        }
                    }}
                    className="group relative overflow-hidden rounded-3xl shadow-xl"
                >
                    <img
                        src={activeSlideImage}
                        alt={activeItem?.name || "Hero"}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="eager"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${slideBackgrounds[activeSlide % slideBackgrounds.length]} opacity-70`} />
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.35),_transparent_40%)]" />

                    <div className="relative z-10 grid min-h-[330px] gap-5 p-6 sm:min-h-[390px] sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/80">
                                {t("featured_collection", "Featured Collection")}
                            </p>
                            <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white sm:text-5xl">
                                {activeItem?.name || "Shop smart with fresh deals today"}
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm text-white/90 sm:text-base">
                                {activeItem?.brand?.name
                                    ? `${activeItem.brand.name} collections are trending now with fast checkout and secure delivery updates.`
                                    : "Find popular products from verified shops and purchase with confidence."}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href={activeItem?.slug ? route("product.show", { slug: activeItem.slug }) : route("home")}
                                    className="rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-slate-100"
                                >
                                    {t("explore_product", "Explore Product")}
                                </Link>
                            </div>
                        </div>

                        <div className="hidden rounded-2xl border border-white/30 bg-white/15 p-5 backdrop-blur md:block">
                            <p className="text-xs font-black uppercase tracking-widest text-white/80">Live Snapshot</p>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-white">
                                <div>
                                    <p className="text-[11px] text-white/70">{t("products", "Products")}</p>
                                    <p className="text-2xl font-black">{products.length}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-white/70">{t("categories", "Categories")}</p>
                                    <p className="text-2xl font-black">{categories.length}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[11px] text-white/70">{t("active_brand", "Active Brand")}</p>
                                    <p className="text-sm font-bold">{activeItem?.brand?.name || "LaraPee Store"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {sliderItems.length > 1 && (
                        <>
                            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                                {sliderItems.map((item, index) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveSlide(index)}
                                        className={`h-2.5 rounded-full transition ${
                                            index === activeSlide ? "w-8 bg-white" : "w-2.5 bg-white/60 hover:bg-white"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => filterByCategory(null)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                activeCategory === ""
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {t("all", "All")}
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => filterByCategory(cat.id)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                                    activeCategory === String(cat.id)
                                        ? "bg-orange-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </section>

                {flashSaleProducts.length > 0 && (
                    <section className="space-y-4 rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 p-4 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Flash Sale</h2>
                            <p className="rounded-full bg-rose-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                                Limited Time
                            </p>
                        </div>
                        <p className="text-sm text-slate-600">
                            Active discounts are live now. Open product details to buy at sale price.
                        </p>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {flashSaleProducts.map((product) => {
                                const price = priceMeta(product);

                                return (
                                    <Link
                                        href={route("product.show", { slug: product.slug })}
                                        key={`flash-${product.id}`}
                                        className="group overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-rose-100 to-orange-100">
                                            <img
                                                src={getProductImage(product)}
                                                alt={product.name}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            <div className="absolute left-2 top-2 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-extrabold text-white">
                                                Flash Sale
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="min-h-[40px] text-sm font-bold leading-tight text-slate-800">{product.name}</h3>
                                            <div className="mt-2 flex items-end gap-2">
                                                <p className="text-sm font-black text-rose-600">Ks {price.effective.toLocaleString()}</p>
                                                <p className="text-xs text-slate-400 line-through">{price.base.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900 sm:text-2xl">{t("discover_products", "Discover Products")}</h2>
                        <p className="text-sm font-semibold text-slate-500">{filteredProducts.length} {t("items_found", "items found")}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => {
                                const price = priceMeta(product);

                                return (
                                    <Link
                                        href={route("product.show", { slug: product.slug })}
                                        key={product.id}
                                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
                                    >
                                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                                        <img
                                            src={getProductImage(product)}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        {(product?.variants?.[0]?.stock_level || 0) > 0 && (
                                            <div className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-extrabold text-white">
                                                In Stock
                                            </div>
                                        )}
                                        {price.hasDiscount && (
                                            <div className="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-extrabold text-white">
                                                {price.flashSale ? "Flash Sale" : "Sale"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 sm:p-4">
                                        <h3 className="min-h-[40px] text-sm font-bold leading-tight text-slate-800 transition group-hover:text-orange-600">
                                            {product.name}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-400">{product.shop?.name || "Unknown shop"}</p>

                                        <div className="mt-3 flex items-baseline gap-1">
                                            <span className="text-[11px] font-bold text-orange-600">Ks</span>
                                            <span className="text-lg font-black text-orange-600">{price.effective.toLocaleString()}</span>
                                            {price.hasDiscount && (
                                                <span className="text-xs text-slate-400 line-through">
                                                    {price.base.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                                            <span className="truncate">{product.brand?.name || "Brand"}</span>
                                            <span>{product?.variants?.[0]?.stock_level ?? 0} left</span>
                                        </div>
                                    </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="col-span-full rounded-2xl border border-slate-200 bg-white py-20 text-center text-slate-500">
                                No products matched your search.
                            </div>
                        )}
                    </div>
                </section>

                {aiRecommendations.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Recommended for You</h2>
                            <p className="text-sm font-semibold text-slate-500">Based on your browsing and order behavior</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {aiRecommendations.map((product) => {
                                const price = priceMeta(product);

                                return (
                                    <Link
                                        href={route("product.show", { slug: product.slug })}
                                        key={`ai-${product.id}`}
                                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                                            <img
                                                src={getProductImage(product)}
                                                alt={product.name}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <h3 className="min-h-[40px] text-sm font-bold leading-tight text-slate-800">{product.name}</h3>
                                            <p className="mt-1 text-[11px] text-slate-400">{product.shop?.name || "LaraPee Store"}</p>
                                            <p className="mt-2 text-sm font-black text-orange-600">Ks {price.effective.toLocaleString()}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

            {showFlashModal && flashSaleProducts.length > 0 && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 px-4">
                    <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl">
                        <div className="rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-3 text-white">
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em]">Flash Sale</p>
                            <h3 className="mt-1 text-xl font-black">Deals are live now</h3>
                        </div>

                        <p className="mt-4 text-sm text-slate-600">
                            {flashSaleProducts.length} product(s) are currently on flash sale.
                        </p>

                        <div className="mt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowFlashModal(false)}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                                Later
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowFlashModal(false);
                                    const target = flashSaleProducts[0];
                                    if (target?.slug) {
                                        router.visit(route("product.show", { slug: target.slug }));
                                    }
                                }}
                                className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-rose-700"
                            >
                                Shop Flash Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
