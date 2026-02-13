import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { useMemo, useState, useCallback } from "react";
import {
    FaArrowRight,
    FaArrowRightArrowLeft,
    FaBoxOpen,
    FaBoxesStacked,
    FaChartColumn,
    FaClipboardList,
    FaClock,
    FaFloppyDisk,
    FaGear,
    FaLink,
    FaLock,
    FaMagnifyingGlass,
    FaPenToSquare,
    FaSackDollar,
    FaStore,
    FaTag,
    FaTriangleExclamation,
    FaTruckFast,
    FaUser,
} from "react-icons/fa6";
import { sanitizePaginationLabel } from "@/utils/sanitizePaginationLabel";

// ===== CONSTANTS =====
const LOW_STOCK_THRESHOLD = 5;
const FEEDBACK_TIMEOUT = 3000;

// ===== REUSABLE COMPONENTS =====
function MetricCard({ label, value, icon, tone = "slate" }) {
    const toneClasses = {
        slate: "border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300",
        red: "border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300",
        blue: "border-sky-200 dark:border-sky-500/30 text-sky-600 dark:text-sky-300",
        orange: "border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-300",
        indigo: "border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300",
    };

    return (
        <div className={`rounded-2xl border bg-white/85 dark:bg-slate-900/70 backdrop-blur px-5 py-4 shadow-sm ${toneClasses[tone]}`}>
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider">
                    {label}
                </p>
                <span className="text-xl">{icon}</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{value}</p>
        </div>
    );
}

function FormInput({ label, type = "text", className = "", ...props }) {
    return (
        <div className={className}>
            {label && (
                <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {label}
                </label>
            )}
            <input
                type={type}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/40"
                {...props}
            />
        </div>
    );
}

function FormSelect({
    label,
    options,
    className = "",
    colorScheme = "indigo",
    ...props
}) {
    const focusClassByScheme = {
        indigo: "focus:border-sky-400 focus:ring-sky-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/40",
        orange: "focus:border-amber-400 focus:ring-amber-100 dark:focus:border-amber-400 dark:focus:ring-amber-900/40",
        blue: "focus:border-sky-400 focus:ring-sky-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/40",
        purple: "focus:border-violet-400 focus:ring-violet-100 dark:focus:border-violet-400 dark:focus:ring-violet-900/40",
    };
    const focusClass = focusClassByScheme[colorScheme] || focusClassByScheme.indigo;

    return (
        <div className={className}>
            {label && (
                <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {label}
                </label>
            )}
            <select
                className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${focusClass}`}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function VariantSelect({
    label,
    value,
    onChange,
    variants,
    placeholder,
    colorScheme = "indigo",
}) {
    const options = [
        { value: "", label: placeholder },
        ...variants.map((v) => ({
            value: v.id,
            label: `${v.product?.shop?.name} | ${v.product?.name} | ${v.sku} (လက်ကျန်: ${v.stock_level})`,
        })),
    ];

    return (
        <FormSelect
            label={label}
            options={options}
            value={value}
            onChange={onChange}
            colorScheme={colorScheme}
        />
    );
}

function ShopSelect({
    label,
    value,
    onChange,
    shops,
    placeholder,
    colorScheme = "indigo",
}) {
    const options = [
        { value: "", label: placeholder },
        ...shops.map((s) => ({ value: s.id, label: s.name })),
    ];

    return (
        <FormSelect
            label={label}
            options={options}
            value={value}
            onChange={onChange}
            colorScheme={colorScheme}
        />
    );
}

function SelectedVariantInfo({ variant, color = "orange" }) {
    if (!variant) return null;

    const colorClasses = {
        orange: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300",
        blue: "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-300",
    };

    return (
        <div
            className={`mb-4 p-4 rounded-xl border-2 shadow-sm ${colorClasses[color]}`}
        >
            <p
                className={`mb-1 text-xs font-semibold ${color === "orange" ? "text-amber-700 dark:text-amber-300" : "text-sky-700 dark:text-sky-300"}`}
            >
                ရွေးချယ်ထားသော SKU
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {variant.product?.name}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                SKU: {variant.sku} • လက်ကျန်:{" "}
                <span
                    className={`font-bold ${color === "orange" ? "text-amber-600 dark:text-amber-300" : "text-sky-600 dark:text-sky-300"}`}
                >
                    {variant.stock_level}
                </span>
            </p>
        </div>
    );
}

function EmptyState({ icon, title, subtitle, colSpan = 6 }) {
    return (
        <tr>
            <td colSpan={colSpan} className="px-6 py-16 text-center">
                <div className="text-slate-400 dark:text-slate-500">
                    <div className="text-4xl mb-3">{icon}</div>
                    <p className="font-semibold">{title}</p>
                    {subtitle && <p className="text-xs mt-1">{subtitle}</p>}
                </div>
            </td>
        </tr>
    );
}

function StockBadge({ level }) {
    const isLow = level <= LOW_STOCK_THRESHOLD;
    return (
        <span
            className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                isLow
                    ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/35"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/35"
            }`}
        >
            {level}
        </span>
    );
}

// ===== MAIN COMPONENT =====
export default function InventoryIndex({
    variants,
    transfers = [],
    shops = [],
    shares = [],
    canManageShares = false,
    filters = {},
}) {
    const [q, setQ] = useState(filters?.q || "");
    const [selectedShop, setSelectedShop] = useState(
        filters?.shop_id ? String(filters.shop_id) : "",
    );
    const [actionTab, setActionTab] = useState("adjust");
    const [lowStockOnly, setLowStockOnly] = useState(
        Boolean(filters?.low_stock),
    );
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

    // ===== COMPUTED VALUES =====
    const stats = useMemo(
        () => ({
            totalVariants: variantRows.length,
            lowStockCount: variantRows.filter(
                (v) => Number(v.stock_level || 0) <= LOW_STOCK_THRESHOLD,
            ).length,
            transferCount: transfers.length,
            shareRules: shares.length,
        }),
        [variantRows, transfers.length, shares.length],
    );

    const selectedAdjustVariant = useMemo(
        () =>
            variantRows.find(
                (v) => String(v.id) === String(adjustForm.data.variant_id),
            ),
        [variantRows, adjustForm.data.variant_id],
    );

    const selectedTransferVariant = useMemo(
        () =>
            variantRows.find(
                (v) => String(v.id) === String(transferForm.data.variant_id),
            ),
        [variantRows, transferForm.data.variant_id],
    );

    // ===== HELPER FUNCTIONS =====
    const showFeedback = useCallback((tone, message) => {
        setFeedback({ tone, message });
        setTimeout(
            () => setFeedback({ tone: "", message: "" }),
            FEEDBACK_TIMEOUT,
        );
    }, []);

    const handleFormSubmit = useCallback(
        (form, route, successMsg, errorMsg, resetFields = []) =>
            (e) => {
                e.preventDefault();
                form.post(route, {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (resetFields.length) form.reset(...resetFields);
                        showFeedback("success", `✓ ${successMsg}`);
                    },
                    onError: () => showFeedback("error", `✗ ${errorMsg}`),
                });
            },
        [showFeedback],
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
        router.get(
            route("admin.inventory.index"),
            {},
            { preserveState: true, replace: true },
        );
    };

    const prefillForm = useCallback((form, variant, extraData = {}) => {
        form.setData({ variant_id: String(variant.id), ...extraData });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    // ===== EVENT HANDLERS =====
    const submitAdjust = handleFormSubmit(
        adjustForm,
        route("admin.inventory.adjust"),
        "ကုန်လက်ကျန် ပြင်ဆင်ပြီးပါပြီ",
        "ကုန်လက်ကျန် ပြင်ဆင်ခြင်း မအောင်မြင်ပါ",
        ["quantity", "note"],
    );

    const submitTransfer = handleFormSubmit(
        transferForm,
        route("admin.inventory.transfer"),
        "ဆိုင်ခွဲအကြား ကုန်လွှဲပြောင်းပြီးပါပြီ",
        "ကုန်လွှဲပြောင်းမှု မအောင်မြင်ပါ",
        ["quantity", "note"],
    );

    const submitShare = handleFormSubmit(
        shareForm,
        route("admin.inventory.share"),
        "Share Permission သိမ်းဆည်းပြီးပါပြီ",
        "Share Permission အပ်ဒိတ်မအောင်မြင်ပါ",
    );

    return (
        <AdminLayout header="ကုန်ပစ္စည်းစီမံခန့်ခွဲမှု">
            <Head title="Inventory Management" />

            <div className="space-y-8 pb-8">
                {/* Feedback Alert */}
                {feedback.message && (
                    <div
                        className={`animate-in slide-in-from-top rounded-2xl border px-6 py-4 text-sm font-semibold shadow-sm duration-300 ${
                            feedback.tone === "error"
                                ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                        }`}
                    >
                        {feedback.message}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="စုစုပေါင်း SKU"
                        value={stats.totalVariants}
                        icon={<FaChartColumn />}
                        tone="indigo"
                    />
                    <MetricCard
                        label="လက်ကျန်နည်းနေသော SKU"
                        value={stats.lowStockCount}
                        icon={<FaTriangleExclamation />}
                        tone="red"
                    />
                    <MetricCard
                        label="ယနေ့ လွှဲပြောင်းမှု"
                        value={stats.transferCount}
                        icon={<FaArrowRightArrowLeft />}
                        tone="blue"
                    />
                    <MetricCard
                        label="Share Permission"
                        value={stats.shareRules}
                        icon={<FaLink />}
                        tone="orange"
                    />
                </div>

                {/* Search & Filter */}
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                            <FaMagnifyingGlass className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                                ကုန်ပစ္စည်း ရှာဖွေခြင်း
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Product အမည်၊ SKU၊ Brand၊ Category (သို့)
                                ဆိုင်ခွဲအမည် ဖြင့် ရှာဖွေနိုင်ပါသည်
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={applyFilters}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4"
                    >
                        <FormInput
                            label="ရှာမည့်စာသား"
                            placeholder="Product / SKU / Brand / Category"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="lg:col-span-2"
                        />

                        <ShopSelect
                            label="ဆိုင်ခွဲ ရွေးချယ်ရန်"
                            value={selectedShop}
                            onChange={(e) => setSelectedShop(e.target.value)}
                            shops={shops}
                            placeholder="ဆိုင်ခွဲအားလုံး"
                            className="lg:col-span-2"
                        />

                        <div className="space-y-3 lg:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                                စစ်ထုတ်မှု ရွေးချယ်ချက်
                            </label>
                            <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 transition hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-cyan-400">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-cyan-400 dark:focus:ring-cyan-500"
                                    checked={lowStockOnly}
                                    onChange={(e) =>
                                        setLowStockOnly(e.target.checked)
                                    }
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <FaTriangleExclamation className="mr-2 inline h-3.5 w-3.5 text-amber-500" />
                                    လက်ကျန်နည်းများသာ ပြရန်
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2 lg:col-span-6">
                            <button
                                type="submit"
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-8 py-3.5 text-sm font-bold text-white transition duration-200 hover:bg-sky-500 md:flex-none"
                            >
                                <FaMagnifyingGlass className="h-3.5 w-3.5" />
                                ရှာမည်
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:flex-none"
                            >
                                <FaArrowRightArrowLeft className="h-3.5 w-3.5" />
                                ပြန်ရှင်းမည်
                            </button>
                        </div>
                    </form>
                </div>

                {/* Action Forms */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                                Inventory Actions
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Form တစ်ခုချင်းစီကို tab ခွဲပြီး လုပ်ဆောင်နိုင်ပါသည်။
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                            <button
                                type="button"
                                onClick={() => setActionTab("adjust")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                    actionTab === "adjust"
                                        ? "bg-orange-600 text-white"
                                        : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                                }`}
                            >
                                Adjust
                            </button>
                            <button
                                type="button"
                                onClick={() => setActionTab("transfer")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                    actionTab === "transfer"
                                        ? "bg-orange-600 text-white"
                                        : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                                }`}
                            >
                                Transfer
                            </button>
                            {canManageShares && (
                                <button
                                    type="button"
                                    onClick={() => setActionTab("share")}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                        actionTab === "share"
                                            ? "bg-orange-600 text-white"
                                            : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    Share Permission
                                </button>
                            )}
                        </div>
                    </div>

                    {actionTab === "adjust" && (
                        <div className="rounded-2xl border border-amber-200 bg-white p-5 dark:border-amber-500/30 dark:bg-slate-900/70">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                                    <FaPenToSquare className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                                        လက်ကျန် ပြင်ဆင်ခြင်း
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        SKU အလိုက် ထည့်/လျှော့/သတ်မှတ် ပြုလုပ်ရန်
                                    </p>
                                </div>
                            </div>

                            <SelectedVariantInfo variant={selectedAdjustVariant} color="orange" />

                            <form onSubmit={submitAdjust} className="space-y-4">
                                <VariantSelect
                                    label="SKU ရွေးချယ်ပါ"
                                    value={adjustForm.data.variant_id}
                                    onChange={(e) => adjustForm.setData("variant_id", e.target.value)}
                                    variants={variantRows}
                                    placeholder="SKU ရွေးချယ်ပါ..."
                                    colorScheme="orange"
                                />

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <FormSelect
                                        label="လုပ်ဆောင်ချက်"
                                        value={adjustForm.data.action}
                                        onChange={(e) => adjustForm.setData("action", e.target.value)}
                                        options={[
                                            { value: "add", label: "ထည့်" },
                                            { value: "remove", label: "လျှော့" },
                                            { value: "set", label: "သတ်မှတ်" },
                                        ]}
                                        colorScheme="orange"
                                    />
                                    <FormInput
                                        label="အရေအတွက်"
                                        type="number"
                                        min="0"
                                        value={adjustForm.data.quantity}
                                        onChange={(e) => adjustForm.setData("quantity", Number(e.target.value))}
                                        required
                                    />
                                    <div className="flex items-end">
                                        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-bold text-white transition hover:bg-orange-500">
                                            <FaFloppyDisk className="h-3.5 w-3.5" />
                                            သိမ်း
                                        </button>
                                    </div>
                                </div>

                                <FormInput
                                    label="မှတ်ချက် (ရွေးချယ်ရန်)"
                                    placeholder="မှတ်ချက်ရေးရန်..."
                                    value={adjustForm.data.note}
                                    onChange={(e) => adjustForm.setData("note", e.target.value)}
                                />
                            </form>
                        </div>
                    )}

                    {actionTab === "transfer" && (
                        <div className="rounded-2xl border border-sky-200 bg-white p-5 dark:border-sky-500/30 dark:bg-slate-900/70">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                                    <FaArrowRightArrowLeft className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                                        ဆိုင်ခွဲအကြား လွှဲပြောင်းခြင်း
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        တစ်ဆိုင်ခွဲမှ အခြားဆိုင်ခွဲသို့ ကုန်ပစ္စည်း ရွှေ့ရန်
                                    </p>
                                </div>
                            </div>

                            <SelectedVariantInfo variant={selectedTransferVariant} color="blue" />

                            <form onSubmit={submitTransfer} className="space-y-4">
                                <VariantSelect
                                    label="မူလ SKU ရွေးချယ်ပါ"
                                    value={transferForm.data.variant_id}
                                    onChange={(e) => transferForm.setData("variant_id", e.target.value)}
                                    variants={variantRows}
                                    placeholder="မူလ SKU ရွေးချယ်ပါ..."
                                    colorScheme="blue"
                                />

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <ShopSelect
                                        label="လွှဲပို့မည့် ဆိုင်ခွဲ"
                                        value={transferForm.data.to_shop_id}
                                        onChange={(e) => transferForm.setData("to_shop_id", e.target.value)}
                                        shops={shops}
                                        placeholder="ဆိုင်ရွေးပါ..."
                                        colorScheme="blue"
                                    />
                                    <FormInput
                                        label="အရေအတွက်"
                                        type="number"
                                        min="1"
                                        value={transferForm.data.quantity}
                                        onChange={(e) => transferForm.setData("quantity", Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <FormInput
                                    label="မှတ်ချက် (ရွေးချယ်ရန်)"
                                    placeholder="လွှဲပြောင်းမှု အကြောင်းအရာ..."
                                    value={transferForm.data.note}
                                    onChange={(e) => transferForm.setData("note", e.target.value)}
                                />

                                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 font-bold text-white transition hover:bg-orange-500">
                                    <FaTruckFast className="h-4 w-4" />
                                    လွှဲပြောင်းမည်
                                </button>
                            </form>
                        </div>
                    )}

                    {actionTab === "share" && canManageShares && (
                        <div className="rounded-2xl border border-orange-200 bg-white p-5 dark:border-orange-500/30 dark:bg-slate-900/70">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                                    <FaLock className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                                        Share Permission စီမံခန့်ခွဲမှု
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        ဆိုင်ခွဲများအကြား Stock မျှဝေခွင့် ပေးရန် (Admin သာ)
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={submitShare} className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                                <ShopSelect
                                    label="မူလ ဆိုင်ခွဲ"
                                    value={shareForm.data.from_shop_id}
                                    onChange={(e) => shareForm.setData("from_shop_id", e.target.value)}
                                    shops={shops}
                                    placeholder="မူလ ဆိုင်"
                                    colorScheme="purple"
                                />
                                <ShopSelect
                                    label="ပန်းတိုင် ဆိုင်ခွဲ"
                                    value={shareForm.data.to_shop_id}
                                    onChange={(e) => shareForm.setData("to_shop_id", e.target.value)}
                                    shops={shops}
                                    placeholder="ပန်းတိုင် ဆိုင်"
                                    colorScheme="purple"
                                />
                                <FormSelect
                                    label="အခြေအနေ"
                                    value={shareForm.data.is_enabled ? "1" : "0"}
                                    onChange={(e) => shareForm.setData("is_enabled", e.target.value === "1")}
                                    options={[
                                        { value: "1", label: "ဖွင့်ထား" },
                                        { value: "0", label: "ပိတ်ထား" },
                                    ]}
                                    colorScheme="purple"
                                />
                                <div className="flex items-end">
                                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-bold text-white transition hover:bg-orange-500">
                                        <FaFloppyDisk className="h-3.5 w-3.5" />
                                        သိမ်း
                                    </button>
                                </div>
                            </form>

                            {shares.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                                        လက်ရှိ Permissions
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {shares.map((share) => (
                                            <div
                                                key={share.id}
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-orange-300 dark:border-slate-700 dark:bg-slate-900"
                                            >
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    {share.from_shop?.name} <span className="mx-1 text-orange-500">→</span> {share.to_shop?.name}
                                                </p>
                                                <span
                                                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                                                        share.is_enabled
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                                                    }`}
                                                >
                                                    {share.is_enabled ? "ဖွင့်ထား" : "ပိတ်ထား"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Inventory Table */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70">
                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-900/80">
                        <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
                            <FaClipboardList className="h-4 w-4" /> လက်ရှိ ကုန်လက်ကျန် စာရင်း
                        </h3>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            ပြင်ဆင် (သို့) လွှဲပြောင်း ခလုတ်များကို နှိပ်၍
                            အပေါ်ရှိ Form များတွင် အလိုအလျောက်
                            ဖြည့်သွင်းပေးပါမည်
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100/80 dark:bg-slate-800/70">
                                <tr className="border-b border-slate-200 text-left text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-400">
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaStore className="h-3 w-3" />
                                            ဆိုင်ခွဲ
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaBoxOpen className="h-3 w-3" />
                                            ကုန်ပစ္စည်း
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaTag className="h-3 w-3" />
                                            SKU
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaSackDollar className="h-3 w-3" />
                                            ဈေးနှုန်း
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaChartColumn className="h-3 w-3" />
                                            လက်ကျန်
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaGear className="h-3 w-3" />
                                            လုပ်ဆောင်ချက်
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {variantRows.length > 0 ? (
                                    variantRows.map((variant) => (
                                        <tr
                                            key={variant.id}
                                            className="transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                                {variant.product?.shop?.name ||
                                                    "—"}
                                            </td>
                                            <td className="px-6 py-4 text-slate-800 dark:text-slate-100">
                                                {variant.product?.name || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="rounded bg-slate-100 px-2 py-1 font-mono font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                                                    {variant.sku || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                                                {Number(
                                                    variant.price || 0,
                                                ).toLocaleString()}{" "}
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    MMK
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StockBadge
                                                    level={variant.stock_level}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            prefillForm(
                                                                adjustForm,
                                                                variant,
                                                                {
                                                                    quantity: 1,
                                                                    action: "add",
                                                                },
                                                            )
                                                        }
                                                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                                                    >
                                                        <span className="inline-flex items-center gap-1">
                                                            <FaPenToSquare className="h-3 w-3" />
                                                            ပြင်ဆင်
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            prefillForm(
                                                                transferForm,
                                                                variant,
                                                                { quantity: 1 },
                                                            )
                                                        }
                                                        className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/35 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/15"
                                                    >
                                                        <span className="inline-flex items-center gap-1">
                                                            <FaArrowRightArrowLeft className="h-3 w-3" />
                                                            လွှဲပြောင်း
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <EmptyState
                                        icon={<FaBoxesStacked />}
                                        title="ကုန်ပစ္စည်း မရှိသေးပါ"
                                    />
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {variants?.links?.length > 1 && (
                        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
                            {variants.links.map((link, idx) => (
                                <Link
                                    key={`${link.label}-${idx}`}
                                    href={link.url || "#"}
                                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition duration-200 ${
                                        link.active
                                            ? "border-sky-500 bg-sky-600 text-white"
                                            : "border-slate-300 bg-white text-slate-600 hover:border-sky-400 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                    } ${!link.url ? "opacity-40 pointer-events-none" : ""}`}
                                >
                                    {sanitizePaginationLabel(link.label)}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Transfer History */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70">
                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-900/80">
                        <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
                            <FaClipboardList className="h-4 w-4" /> လွှဲပြောင်းမှု မှတ်တမ်း
                        </h3>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            လတ်တလော လုပ်ဆောင်ခဲ့သော ကုန်လွှဲပြောင်းမှုများ
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100/80 dark:bg-slate-800/70">
                                <tr className="border-b border-slate-200 text-left text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-400">
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaClock className="h-3 w-3" />
                                            အချိန်
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaStore className="h-3 w-3" />
                                            မူလဆိုင်
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaArrowRight className="h-3 w-3" />
                                            ပန်းတိုင်ဆိုင်
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaTag className="h-3 w-3" />
                                            SKU
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaChartColumn className="h-3 w-3" />
                                            အရေအတွက်
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaUser className="h-3 w-3" />
                                            လုပ်ဆောင်သူ
                                        </span>
                                    </th>
                                    <th className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2">
                                            <FaGear className="h-3 w-3" />
                                            အခြေအနေ
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transfers.length > 0 ? (
                                    transfers.map((transfer) => (
                                        <tr
                                            key={transfer.id}
                                            className="transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        >
                                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                                                {new Date(
                                                    transfer.created_at,
                                                ).toLocaleString("en-GB", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                                {transfer.from_shop?.name ||
                                                    "—"}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                                {transfer.to_shop?.name || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="rounded bg-slate-100 px-2 py-1 font-mono font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                                                    {transfer.source_variant
                                                        ?.sku || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-sky-600 dark:text-sky-300">
                                                {transfer.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                {transfer.initiator?.name ||
                                                    "System"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-block rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                    {transfer.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <EmptyState
                                        icon={<FaClipboardList />}
                                        title="မှတ်တမ်း မရှိသေးပါ"
                                        subtitle="ကုန်လွှဲပြောင်းမှု မရှိသေးပါ"
                                        colSpan={7}
                                    />
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
