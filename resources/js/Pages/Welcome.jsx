import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";

export default function Welcome({
    products = [],
    categories = [],
    filters = {},
    auth,
}) {
    const [search, setSearch] = useState(filters?.search || "");
    const [activeCategory, setActiveCategory] = useState(
        filters?.category ? String(filters.category) : "",
    );
    const [activeSlide, setActiveSlide] = useState(0);
    const [pauseSlider, setPauseSlider] = useState(false);

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

    const handleSearch = (e) => {
        e.preventDefault();
    };

    const filterByCategory = (id) => {
        const nextCategory = id ? String(id) : "";
        setActiveCategory(nextCategory);
    };

    useEffect(() => {
        if (pauseSlider || sliderItems.length <= 1) return;

        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % sliderItems.length);
        }, 4200);

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

            return (
                name.includes(keyword) ||
                brand.includes(keyword) ||
                shop.includes(keyword)
            );
        });
    }, [products, search, activeCategory]);
    const getProductImage = (product) => {
        if (product?.image) return product.image;
        if (product?.image_url) return product.image_url;
        if (product?.thumbnail) return product.thumbnail;

        const fallbackIndex = ((Number(product?.id) || 1) % 4) + 1;
        return `/images/products/product-${fallbackIndex}.svg`;
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
                        <Link
                            href="/"
                            className="text-3xl font-black text-orange-600 tracking-tight shrink-0"
                        >
                            LaraPee
                        </Link>

                        <form onSubmit={handleSearch} className="flex-1 max-w-3xl">
                            <div className="relative flex rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 text-slate-800 focus:outline-none"
                                    placeholder="Search products, brands or categories..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button className="px-5 bg-orange-600 hover:bg-orange-700 transition">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-white"
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
                        </form>

                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            {auth?.user ? (
                                <div className="flex items-center gap-3 ml-auto">
                                    <Link
                                        href={route("dashboard")}
                                        className="flex items-center gap-2 group text-slate-700"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold group-hover:bg-orange-200 transition">
                                            {auth.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <span className="hidden sm:inline group-hover:text-orange-600">
                                            Hi, {auth.user.name}
                                        </span>
                                    </Link>
                                    <div className="h-4 w-px bg-slate-300"></div>
                                    <Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                        className="text-slate-500 hover:text-red-500 transition"
                                    >
                                        Logout
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="hover:text-orange-600 transition"
                                    >
                                        Login
                                    </Link>
                                    <div className="h-4 w-px bg-slate-300"></div>
                                    <Link
                                        href="/register"
                                        className="hover:text-orange-600 transition"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
                <section
                    onMouseEnter={() => setPauseSlider(true)}
                    onMouseLeave={() => setPauseSlider(false)}
                    className="group relative rounded-3xl overflow-hidden shadow-xl min-h-[280px] sm:min-h-[340px]"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${activeSlideImage})` }}
                    />
                    <div
                        className={`absolute inset-0 bg-gradient-to-br ${slideBackgrounds[activeSlide % slideBackgrounds.length]}`}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.35),_transparent_45%)]" />
                    <div className="relative z-10 p-6 sm:p-10 h-full flex flex-col justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-white/80 font-black">
                                Featured Collection
                            </p>
                            <h1 className="mt-3 text-3xl sm:text-5xl font-black text-white leading-tight max-w-3xl">
                                {activeItem?.name || "Shop smart with the latest offers"}
                            </h1>
                            <p className="mt-4 text-white/90 text-sm sm:text-base max-w-2xl">
                                {activeItem?.brand?.name
                                    ? `${activeItem.brand.name} products are trending now.`
                                    : "Find fresh products, fast checkout and secure order tracking."}
                            </p>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href={activeItem?.slug ? route("product.show", { slug: activeItem.slug }) : route("home")}
                                className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black hover:bg-slate-100 transition"
                            >
                                Explore This Product
                            </Link>
                            <Link
                                href={auth?.user ? route("dashboard") : route("login")}
                                className="px-5 py-3 rounded-2xl border border-white/60 text-white font-bold hover:bg-white/10 transition"
                            >
                                {auth?.user ? "Open Dashboard" : "Login to Start"}
                            </Link>
                        </div>
                    </div>

                    {sliderItems.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    setActiveSlide(
                                        (prev) => (prev - 1 + sliderItems.length) % sliderItems.length,
                                    )
                                }
                                className="absolute z-30 left-3 sm:left-5 bottom-5 w-10 h-10 rounded-full bg-white/90 text-slate-700 hover:bg-white transition shadow sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setActiveSlide((prev) => (prev + 1) % sliderItems.length)
                                }
                                className="absolute z-30 right-3 sm:right-5 bottom-5 w-10 h-10 rounded-full bg-white/90 text-slate-700 hover:bg-white transition shadow sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto"
                            >
                                ›
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {sliderItems.map((item, index) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveSlide(index)}
                                        className={`h-2.5 rounded-full transition ${
                                            index === activeSlide
                                                ? "w-8 bg-white"
                                                : "w-2.5 bg-white/60 hover:bg-white"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>

                <section className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => filterByCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                                activeCategory === ""
                                    ? "bg-orange-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => filterByCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition capitalize ${
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
                        <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                            Discover Products
                        </h2>
                        <p className="text-sm text-slate-500">{filteredProducts.length} items found</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <Link
                                    href={route("product.show", {
                                        slug: product.slug,
                                    })}
                                    key={product.id}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-slate-100 hover:border-orange-400 overflow-hidden group"
                                >
                                    <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative overflow-hidden">
                                        <img
                                            src={getProductImage(product)}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        {product.variants[0]?.stock_level >
                                            0 && (
                                            <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                                In Stock
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 sm:p-4">
                                        <h3 className="text-sm leading-tight text-slate-800 line-clamp-2 min-h-[38px] mb-3 group-hover:text-orange-600 font-semibold">
                                            {product.name}
                                        </h3>

                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-[11px] text-orange-600 font-bold">Ks</span>
                                            <span className="text-lg text-orange-600 font-black">
                                                {product.variants?.[0]?.price?.toLocaleString() ??
                                                    "N/A"}
                                            </span>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                                            <span className="truncate max-w-[100px]">
                                                {product.shop?.name}
                                            </span>
                                            <span>
                                                {product.variants?.[0]
                                                    ?.stock_level ?? 0}{" "}
                                                ခုကျန်
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                                No products matched your search.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
