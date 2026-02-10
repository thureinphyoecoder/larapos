import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { sanitizePaginationLabel } from "@/utils/sanitizePaginationLabel";

export default function InventoryIndex({
    variants,
    transfers = [],
    shops = [],
    shares = [],
    canManageShares = false,
    filters = {},
}) {
    const [q, setQ] = useState(filters?.q || "");
    const [selectedShop, setSelectedShop] = useState(filters?.shop_id ? String(filters.shop_id) : "");
    const [lowStockOnly, setLowStockOnly] = useState(Boolean(filters?.low_stock));
    const [feedback, setFeedback] = useState({ tone: "", message: "" });

    const adjustForm = useForm({
        variant_id: "",
        action: "add",
        quantity: 0,
        note: "",
    });

    const transferForm = useForm({
        variant_id: "",
        to_shop_id: "",
        quantity: 1,
        note: "",
    });

    const shareForm = useForm({
        from_shop_id: "",
        to_shop_id: "",
        is_enabled: true,
    });

    const variantRows = variants?.data || [];

    const stats = useMemo(() => {
        const lowStockCount = variantRows.filter((variant) => Number(variant.stock_level || 0) <= 5).length;
        return {
            totalVariants: variantRows.length,
            lowStockCount,
            transferCount: transfers.length,
            shareRules: shares.length,
        };
    }, [variantRows, transfers.length, shares.length]);

    const selectedAdjustVariant = useMemo(
        () => variantRows.find((variant) => String(variant.id) === String(adjustForm.data.variant_id)),
        [variantRows, adjustForm.data.variant_id],
    );

    const selectedTransferVariant = useMemo(
        () => variantRows.find((variant) => String(variant.id) === String(transferForm.data.variant_id)),
        [variantRows, transferForm.data.variant_id],
    );

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(
            route("admin.inventory.index"),
            {
                q: q || undefined,
                shop_id: selectedShop || undefined,
                low_stock: lowStockOnly ? 1 : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clearFilters = () => {
        setQ("");
        setSelectedShop("");
        setLowStockOnly(false);
        router.get(route("admin.inventory.index"), {}, { preserveState: true, replace: true });
    };

    const submitAdjust = (e) => {
        e.preventDefault();
        adjustForm.post(route("admin.inventory.adjust"), {
            preserveScroll: true,
            onSuccess: () => {
                adjustForm.reset("quantity", "note");
                setFeedback({ tone: "success", message: "ကုန်လက်ကျန် ပြင်ဆင်ပြီးပါပြီ။" });
            },
            onError: () => setFeedback({ tone: "error", message: "ကုန်လက်ကျန် ပြင်ဆင်ခြင်း မအောင်မြင်ပါ။" }),
        });
    };

    const submitTransfer = (e) => {
        e.preventDefault();
        transferForm.post(route("admin.inventory.transfer"), {
            preserveScroll: true,
            onSuccess: () => {
                transferForm.reset("quantity", "note");
                setFeedback({ tone: "success", message: "ဆိုင်ခွဲအကြား ကုန်လွှဲပြောင်းပြီးပါပြီ။" });
            },
            onError: () => setFeedback({ tone: "error", message: "ကုန်လွှဲပြောင်းမှု မအောင်မြင်ပါ။" }),
        });
    };

    const submitShare = (e) => {
        e.preventDefault();
        shareForm.post(route("admin.inventory.share"), {
            preserveScroll: true,
            onSuccess: () => setFeedback({ tone: "success", message: "Share permission သိမ်းဆည်းပြီးပါပြီ။" }),
            onError: () => setFeedback({ tone: "error", message: "Share permission update မအောင်မြင်ပါ။" }),
        });
    };

    const prefillAdjust = (variant) => {
        adjustForm.setData("variant_id", String(variant.id));
        adjustForm.setData("quantity", 1);
        adjustForm.setData("action", "add");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const prefillTransfer = (variant) => {
        transferForm.setData("variant_id", String(variant.id));
        transferForm.setData("quantity", 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <AdminLayout header="Inventory">
            <Head title="Inventory" />

            <div className="space-y-6">
                {feedback.message ? (
                    <div
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                            feedback.tone === "error"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                    >
                        {feedback.message}
                    </div>
                ) : null}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard label="ပြနေသော SKU" value={stats.totalVariants} tone="slate" />
                    <MetricCard label="လက်ကျန်နည်း" value={stats.lowStockCount} tone="red" />
                    <MetricCard label="ယနေ့ လွှဲပြောင်းမှု" value={stats.transferCount} tone="blue" />
                    <MetricCard label="Share Rule" value={stats.shareRules} tone="orange" />
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-5">
                    <h3 className="font-black text-slate-900">ကုန်ပစ္စည်း ရှာဖွေခြင်း</h3>
                    <p className="text-sm text-slate-500 mt-1">Product, SKU, Brand, Category သို့မဟုတ် Shop နာမည်ဖြင့်ရှာပါ။</p>
                    <form onSubmit={applyFilters} className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                        <input
                            type="text"
                            className="md:col-span-2 border border-slate-300 rounded-xl px-3 py-2.5"
                            placeholder="Product / SKU / Brand / Category"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <select
                            className="border border-slate-300 rounded-xl px-3 py-2.5"
                            value={selectedShop}
                            onChange={(e) => setSelectedShop(e.target.value)}
                        >
                            <option value="">ဆိုင်ခွဲအားလုံး</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700 font-medium">
                            <input
                                type="checkbox"
                                checked={lowStockOnly}
                                onChange={(e) => setLowStockOnly(e.target.checked)}
                            />
                            လက်ကျန်နည်းများသာ
                        </label>
                        <div className="flex gap-2">
                            <button className="px-3 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold">
                                စစ်ထုတ်မည်
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600"
                            >
                                ပြန်ဖြုတ်မည်
                            </button>
                        </div>
                    </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-5">
                        <h3 className="font-black text-slate-900">၁) လက်ကျန်ပြင်ဆင်ခြင်း</h3>
                        <p className="text-xs text-slate-500 mt-1">SKU တစ်ခုချင်းစီအတွက် ထည့်/လျှော့/တိတိကျကျ သတ်မှတ်နိုင်သည်။</p>
                        {selectedAdjustVariant && (
                            <p className="mt-3 text-xs rounded-lg bg-slate-100 p-2 text-slate-700">
                                ရွေးထားသည်: {selectedAdjustVariant.product?.name} ({selectedAdjustVariant.sku}) | လက်ကျန် {selectedAdjustVariant.stock_level}
                            </p>
                        )}
                        <form onSubmit={submitAdjust} className="mt-4 space-y-3">
                            <select
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                value={adjustForm.data.variant_id}
                                onChange={(e) => adjustForm.setData("variant_id", e.target.value)}
                                required
                            >
                                <option value="">SKU ရွေးပါ</option>
                                {variantRows.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                        {variant.product?.shop?.name} | {variant.product?.name} | {variant.sku} (လက်ကျန် {variant.stock_level})
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-3 gap-3">
                                <select
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    value={adjustForm.data.action}
                                    onChange={(e) => adjustForm.setData("action", e.target.value)}
                                >
                                    <option value="add">အရေအတွက် ထည့်မည်</option>
                                    <option value="remove">အရေအတွက် လျှော့မည်</option>
                                    <option value="set">တိတိကျကျ သတ်မှတ်မည်</option>
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    value={adjustForm.data.quantity}
                                    onChange={(e) => adjustForm.setData("quantity", Number(e.target.value))}
                                    required
                                />
                                <button className="bg-orange-600 text-white rounded-xl font-bold">သိမ်းမည်</button>
                            </div>
                            <input
                                type="text"
                                placeholder="မှတ်ချက် (မထည့်လည်းရ)"
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                value={adjustForm.data.note}
                                onChange={(e) => adjustForm.setData("note", e.target.value)}
                            />
                        </form>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-5">
                        <h3 className="font-black text-slate-900">၂) ဆိုင်ခွဲအကြား ကုန်လွှဲပြောင်း</h3>
                        <p className="text-xs text-slate-500 mt-1">Source SKU မှ destination shop သို့ လက်ကျန်ရွှေ့နိုင်သည်။</p>
                        {selectedTransferVariant && (
                            <p className="mt-3 text-xs rounded-lg bg-slate-100 p-2 text-slate-700">
                                မူလ SKU: {selectedTransferVariant.product?.shop?.name} | {selectedTransferVariant.product?.name} ({selectedTransferVariant.sku})
                            </p>
                        )}
                        <form onSubmit={submitTransfer} className="mt-4 space-y-3">
                            <select
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                value={transferForm.data.variant_id}
                                onChange={(e) => transferForm.setData("variant_id", e.target.value)}
                                required
                            >
                                <option value="">မူလ SKU ရွေးပါ</option>
                                {variantRows.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                        {variant.product?.shop?.name} | {variant.product?.name} | {variant.sku} (လက်ကျန် {variant.stock_level})
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    value={transferForm.data.to_shop_id}
                                    onChange={(e) => transferForm.setData("to_shop_id", e.target.value)}
                                    required
                                >
                                    <option value="">သွားမည့်ဆိုင်ရွေးပါ</option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min="1"
                                    className="border border-slate-300 rounded-xl px-3 py-2.5"
                                    value={transferForm.data.quantity}
                                    onChange={(e) => transferForm.setData("quantity", Number(e.target.value))}
                                    required
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="လွှဲပြောင်း မှတ်ချက်"
                                className="w-full border border-slate-300 rounded-xl px-3 py-2.5"
                                value={transferForm.data.note}
                                onChange={(e) => transferForm.setData("note", e.target.value)}
                            />
                            <button className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold">
                                လွှဲပြောင်းမည်
                            </button>
                        </form>
                    </div>
                </div>

                {canManageShares && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-5">
                        <h3 className="font-black text-slate-900">၃) Shop Share Permission (Admin)</h3>
                        <p className="text-xs text-slate-500 mt-1">ဆိုင် ၂ ဆိုင်ကြား stock share ခွင့်ကိုဖွင့်/ပိတ် လုပ်နိုင်သည်။</p>
                        <form onSubmit={submitShare} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select
                                className="border border-slate-300 rounded-xl px-3 py-2.5"
                                value={shareForm.data.from_shop_id}
                                onChange={(e) => shareForm.setData("from_shop_id", e.target.value)}
                                required
                            >
                                <option value="">From shop</option>
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                ))}
                            </select>
                            <select
                                className="border border-slate-300 rounded-xl px-3 py-2.5"
                                value={shareForm.data.to_shop_id}
                                onChange={(e) => shareForm.setData("to_shop_id", e.target.value)}
                                required
                            >
                                <option value="">To shop</option>
                                {shops.map((shop) => (
                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                ))}
                            </select>
                            <select
                                className="border border-slate-300 rounded-xl px-3 py-2.5"
                                value={shareForm.data.is_enabled ? "1" : "0"}
                                onChange={(e) => shareForm.setData("is_enabled", e.target.value === "1")}
                            >
                                <option value="1">ဖွင့်ထား</option>
                                <option value="0">ပိတ်ထား</option>
                            </select>
                            <button className="bg-orange-600 text-white rounded-xl font-bold">Permission သိမ်းမည်</button>
                        </form>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {shares.map((share) => (
                                <div key={share.id} className="border border-slate-200 rounded-xl px-3 py-2">
                                    {share.from_shop?.name} → {share.to_shop?.name} :
                                    <span className={`ms-2 font-bold ${share.is_enabled ? "text-emerald-600" : "text-red-500"}`}>
                                        {share.is_enabled ? "ဖွင့်ထား" : "ပိတ်ထား"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 font-black text-slate-900">လက်ရှိ လက်ကျန်စာရင်း (Action နှိပ်ရင် form အလိုအလျောက်ဖြည့်မည်)</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-slate-500 uppercase text-[11px] border-b border-slate-100">
                                    <th className="px-5 py-3">Shop</th>
                                    <th className="px-5 py-3">Product</th>
                                    <th className="px-5 py-3">SKU</th>
                                    <th className="px-5 py-3">ဈေးနှုန်း</th>
                                    <th className="px-5 py-3">လက်ကျန်</th>
                                    <th className="px-5 py-3">လုပ်ဆောင်ချက်</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {variantRows.map((variant) => (
                                    <tr key={variant.id} className="hover:bg-orange-50/30 transition">
                                        <td className="px-5 py-3">{variant.product?.shop?.name || "Shop မသတ်မှတ်ရသေး"}</td>
                                        <td className="px-5 py-3">{variant.product?.name || "Product မသတ်မှတ်ရသေး"}</td>
                                        <td className="px-5 py-3 font-semibold">{variant.sku || "SKU မရှိသေး"}</td>
                                        <td className="px-5 py-3">{Number(variant.price || 0).toLocaleString()} MMK</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${variant.stock_level <= 5 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                                                {variant.stock_level}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => prefillAdjust(variant)}
                                                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                                                >
                                                    ပြင်ဆင်
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => prefillTransfer(variant)}
                                                    className="px-2.5 py-1.5 text-xs rounded-lg border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100"
                                                >
                                                    လွှဲပြောင်း
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {variants?.links?.length > 1 && (
                        <div className="p-4 flex flex-wrap gap-2 border-t border-slate-100">
                            {variants.links.map((link, idx) => (
                                <Link
                                    key={`${link.label}-${idx}`}
                                    href={link.url || "#"}
                                    className={`px-3 py-1 rounded border text-sm ${link.active ? "bg-orange-600 text-white border-orange-600" : "bg-white text-slate-600 border-slate-200"} ${!link.url ? "opacity-50 pointer-events-none" : ""}`}
                                >
                                    {sanitizePaginationLabel(link.label)}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 font-black text-slate-900">လတ်တလော ကုန်လွှဲပြောင်းမှတ်တမ်း</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-slate-500 uppercase text-[11px] border-b border-slate-100">
                                    <th className="px-5 py-3">အချိန်</th>
                                    <th className="px-5 py-3">From</th>
                                    <th className="px-5 py-3">To</th>
                                    <th className="px-5 py-3">SKU</th>
                                    <th className="px-5 py-3">Qty</th>
                                    <th className="px-5 py-3">လုပ်ဆောင်သူ</th>
                                    <th className="px-5 py-3">အခြေအနေ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transfers.length ? (
                                    transfers.map((transfer) => (
                                        <tr key={transfer.id} className="hover:bg-slate-50/70">
                                            <td className="px-5 py-3">{new Date(transfer.created_at).toLocaleString()}</td>
                                            <td className="px-5 py-3">{transfer.from_shop?.name || "မရှိ"}</td>
                                            <td className="px-5 py-3">{transfer.to_shop?.name || "မရှိ"}</td>
                                            <td className="px-5 py-3">{transfer.source_variant?.sku || "မရှိ"}</td>
                                            <td className="px-5 py-3 font-semibold">{transfer.quantity}</td>
                                            <td className="px-5 py-3">{transfer.initiator?.name || "System"}</td>
                                            <td className="px-5 py-3 uppercase text-xs font-bold">{transfer.status}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-10 text-center text-slate-400">
                                            ကုန်လွှဲပြောင်းမှတ်တမ်း မရှိသေးပါ။
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function MetricCard({ label, value, tone = "slate" }) {
    const toneClasses = {
        slate: "bg-slate-900 text-white",
        red: "bg-red-500 text-white",
        blue: "bg-sky-500 text-white",
        orange: "bg-orange-500 text-white",
    };

    return (
        <div className={`rounded-2xl p-4 shadow-sm ${toneClasses[tone] || toneClasses.slate}`}>
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
        </div>
    );
}
