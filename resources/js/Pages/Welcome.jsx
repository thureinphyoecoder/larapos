import { Link, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";

export default function Welcome({
    products = [],
    categories = [],
    filters = {},
    auth,
}) {
    const [search, setSearch] = useState(filters?.search || "");
    const isFirstRender = useRef(true);

    // Search လုပ်တဲ့ Function
    const handleSearch = (e) => {
        e.preventDefault();
        router.get("/", { search: search }, { preserveState: true });
    };

    // Category Filter လုပ်တဲ့ Function
    const filterByCategory = (id) => {
        router.get("/", { category: id }, { preserveState: true });
    };

    useEffect(() => {
        // ပထမဆုံး component တက်လာတဲ့အချိန် (Mount) မှာ မရှာသေးဘဲ ကျော်သွားအောင်
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            router.get(
                "/",
                { search: search },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                    only: ["products"], // Optimization: products ဒေတာပဲ ပြန်တောင်းမယ်
                },
            );
        }, 500); // ၅၀၀ မီလီစက္ကန့်လောက် ထားကြည့်ပါဗျ

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Header Area */}
            <header className="bg-orange-500 sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="text-3xl font-bold text-white tracking-tighter"
                        >
                            LaraPee
                        </Link>

                        {/* Search Bar */}
                        <form
                            onSubmit={handleSearch}
                            className="flex-1 max-w-2xl"
                        >
                            <div className="relative flex">
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-l-sm text-black focus:outline-none"
                                    placeholder="ပစ္စည်းရှာဖွေရန်..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <button className="bg-orange-600 px-6 py-2 rounded-r-sm hover:bg-orange-700 transition">
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

                        {/* Auth Links */}

                        <div className="flex items-center space-x-4 text-white text-sm font-medium">
                            {auth?.user ? (
                                // 🎯 Login ဝင်ထားရင် ဒီအပိုင်း ပေါ်မယ်
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={route("dashboard")}
                                        className="flex items-center gap-2 group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold shadow-sm group-hover:bg-orange-100 transition">
                                            {auth.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <span className="hover:text-orange-100">
                                            မင်္ဂလာပါ၊ {auth.user.name}
                                        </span>
                                    </Link>
                                    <div className="h-4 w-[1px] bg-orange-300"></div>
                                    <Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                        className="hover:text-red-200 transition"
                                    >
                                        ထွက်မည်
                                    </Link>
                                </div>
                            ) : (
                                // 🎯 Login မဝင်ရသေးရင် ဒါလေး ပေါ်မယ်
                                <>
                                    <Link
                                        href="/login"
                                        className="hover:opacity-80"
                                    >
                                        Login
                                    </Link>
                                    <div className="h-4 w-[1px] bg-orange-300"></div>
                                    <Link
                                        href="/register"
                                        className="hover:opacity-80"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
                {/* Sidebar (Categories) */}
                <aside className="w-full md:w-56 shrink-0">
                    <div className="flex items-center gap-2 font-bold text-gray-800 mb-4 border-b pb-2">
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
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                        အမျိုးအစားများ
                    </div>
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => filterByCategory(null)}
                                className="text-sm text-gray-700 hover:text-orange-500 w-full text-left transition"
                            >
                                အားလုံး
                            </button>
                        </li>
                        {categories.map((cat) => (
                            <li key={cat.id}>
                                <button
                                    onClick={() => filterByCategory(cat.id)}
                                    className="text-sm text-gray-700 hover:text-orange-500 w-full text-left transition capitalize"
                                >
                                    {cat.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Main Content (Product Grid) */}
                <main className="flex-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {products.length > 0 ? (
                            products.map((product) => (
                                <Link
                                    href={route("product.show", {
                                        slug: product.slug,
                                    })}
                                    key={product.id}
                                    className="bg-white rounded-sm shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 border border-transparent hover:border-orange-500 overflow-hidden group"
                                >
                                    {/* Image Container */}
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                        <span className="text-gray-300 font-bold uppercase text-xs">
                                            {product.brand?.name}
                                        </span>
                                        {product.variants[0]?.stock_level >
                                            0 && (
                                            <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] px-2 py-0.5 shadow-sm">
                                                Preferred
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-2 pt-3">
                                        <h3 className="text-[13px] leading-tight text-gray-800 line-clamp-2 min-h-[32px] mb-2 group-hover:text-orange-600">
                                            {product.name}
                                        </h3>

                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-[11px] text-orange-600 font-bold">
                                                Ks
                                            </span>
                                            <span className="text-base text-orange-600 font-medium">
                                                {product.variants?.[0]?.price?.toLocaleString() ??
                                                    "N/A"}
                                            </span>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400">
                                            <span className="truncate max-w-[60px]">
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
                            <div className="col-span-full py-20 text-center text-gray-500">
                                ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းမရှိပါ...
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
