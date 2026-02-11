import { Link, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import LocaleSwitcher from "@/Components/LocaleSwitcher";

function priceMeta(product) {
    const variants = product?.variants || [];
    const base = variants.length
        ? Math.min(...variants.map((v) => Number(v?.base_price ?? v?.price ?? 0)))
        : Number(product?.base_price ?? product?.price ?? 0);
    const effective = variants.length
        ? Math.min(...variants.map((v) => Number(v?.effective_price ?? v?.price ?? 0)))
        : Number(product?.price ?? 0);
    const hasDiscount = effective < base;
    const flashSale = variants.some((v) => v?.promotion?.type === "flash_sale");

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
    const cartCount = Number(auth?.cart_count || 0);

    const sliderItems = useMemo(() => {
        const top = products.slice(0, 4);
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

    const getProductImage = (product) => {
        if (product?.image) return product.image;
        if (product?.image_url) return product.image_url;
        if (product?.thumbnail) return product.thumbnail;

        const fallbackIndex = ((Number(product?.id) || 1) % 4) + 1;
        return `/images/products/product-${fallbackIndex}.svg`;
    };

    return (
        <div
            className="min-h-screen bg-slate-100"
            style={{ fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif' }}
        >
            <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:gap-5">
                        <Link href="/" className="shrink-0 text-4xl font-black tracking-tight text-orange-600">
                            LaraPee
                        </Link>

                        <div className="flex-1 min-w-[220px]">
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

                        <div className="ml-auto flex items-center gap-4 text-sm font-semibold text-slate-600">
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
                                        <span className="hidden sm:inline">{t("hi", "Hi")}, {auth.user.name}</span>
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
                            <span className="hidden h-4 w-px bg-slate-300 sm:block" />
                            <LocaleSwitcher />
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <section
                    onMouseEnter={() => setPauseSlider(true)}
                    onMouseLeave={() => setPauseSlider(false)}
                    className="group relative overflow-hidden rounded-3xl shadow-xl"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${activeSlideImage})` }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${slideBackgrounds[activeSlide % slideBackgrounds.length]}`} />
                    <div className="absolute inset-0 bg-black/20" />
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
                                <Link
                                    href={auth?.user ? route("dashboard") : route("login")}
                                    className="rounded-2xl border border-white/70 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                                >
                                    {auth?.user ? t("open_dashboard", "Open Dashboard") : t("login_to_start", "Login to Start")}
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
                            <button
                                type="button"
                                onClick={() => setActiveSlide((prev) => (prev - 1 + sliderItems.length) % sliderItems.length)}
                                className="absolute bottom-5 left-4 z-30 h-11 w-11 rounded-full border border-white/40 bg-white/90 text-lg font-black text-slate-700 shadow transition hover:bg-white sm:opacity-0 sm:pointer-events-none sm:group-hover:pointer-events-auto sm:group-hover:opacity-100"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSlide((prev) => (prev + 1) % sliderItems.length)}
                                className="absolute bottom-5 right-4 z-30 h-11 w-11 rounded-full border border-white/40 bg-white/90 text-lg font-black text-slate-700 shadow transition hover:bg-white sm:opacity-0 sm:pointer-events-none sm:group-hover:pointer-events-auto sm:group-hover:opacity-100"
                            >
                                ›
                            </button>
                            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
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
                            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">AI Recommendations</h2>
                            <p className="text-sm font-semibold text-slate-500">Smart matches for your current interest</p>
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
        </div>
    );
}
