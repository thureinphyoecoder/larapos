import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import Swal from "sweetalert2";

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
                Swal.fire("Updated", "Stock adjusted.", "success");
            },
            onError: () => Swal.fire("Error", "Failed to adjust stock.", "error"),
        });
    };

    const submitTransfer = (e) => {
        e.preventDefault();
        transferForm.post(route("admin.inventory.transfer"), {
            preserveScroll: true,
            onSuccess: () => {
                transferForm.reset("quantity", "note");
                Swal.fire("Transferred", "Stock shared successfully.", "success");
            },
            onError: () => Swal.fire("Error", "Stock transfer failed.", "error"),
        });
    };

    const submitShare = (e) => {
        e.preventDefault();
        shareForm.post(route("admin.inventory.share"), {
            preserveScroll: true,
            onSuccess: () => Swal.fire("Updated", "Share permission saved.", "success"),
            onError: () => Swal.fire("Error", "Could not update permission.", "error"),
        });
    };

    return (
        <AdminLayout header="Inventory & Stock">
            <Head title="Inventory" />

            <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                        <input
                            type="text"
                            className="md:col-span-2 border rounded-lg px-3 py-2"
                            placeholder="Search product, SKU, brand, category..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <select
                            className="border rounded-lg px-3 py-2"
                            value={selectedShop}
                            onChange={(e) => setSelectedShop(e.target.value)}
                        >
                            <option value="">All shops</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                </option>
                            ))}
                        </select>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={lowStockOnly}
                                onChange={(e) => setLowStockOnly(e.target.checked)}
                            />
                            Low stock only
                        </label>
                        <div className="flex gap-2">
                            <button className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold">
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5">
                        <h3 className="font-bold text-slate-800">Stock Adjustment (CRUD)</h3>
                        <form onSubmit={submitAdjust} className="mt-4 space-y-3">
                            <select
                                className="w-full border rounded-lg px-3 py-2"
                                value={adjustForm.data.variant_id}
                                onChange={(e) => adjustForm.setData("variant_id", e.target.value)}
                                required
                            >
                                <option value="">Select variant</option>
                                {variantRows.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                        {variant.product?.shop?.name} | {variant.product?.name} | {variant.sku} (stock {variant.stock_level})
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-3 gap-3">
                                <select
                                    className="border rounded-lg px-3 py-2"
                                    value={adjustForm.data.action}
                                    onChange={(e) => adjustForm.setData("action", e.target.value)}
                                >
                                    <option value="add">Add</option>
                                    <option value="remove">Remove</option>
                                    <option value="set">Set Exact</option>
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    className="border rounded-lg px-3 py-2"
                                    value={adjustForm.data.quantity}
                                    onChange={(e) => adjustForm.setData("quantity", Number(e.target.value))}
                                    required
                                />
                                <button className="bg-orange-600 text-white rounded-lg font-semibold">
                                    Save
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Reason / note (optional)"
                                className="w-full border rounded-lg px-3 py-2"
                                value={adjustForm.data.note}
                                onChange={(e) => adjustForm.setData("note", e.target.value)}
                            />
                        </form>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5">
                        <h3 className="font-bold text-slate-800">Share Stock Between Shops</h3>
                        <form onSubmit={submitTransfer} className="mt-4 space-y-3">
                            <select
                                className="w-full border rounded-lg px-3 py-2"
                                value={transferForm.data.variant_id}
                                onChange={(e) => transferForm.setData("variant_id", e.target.value)}
                                required
                            >
                                <option value="">Source variant</option>
                                {variantRows.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                        {variant.product?.shop?.name} | {variant.product?.name} | {variant.sku} (stock {variant.stock_level})
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    className="border rounded-lg px-3 py-2"
                                    value={transferForm.data.to_shop_id}
                                    onChange={(e) => transferForm.setData("to_shop_id", e.target.value)}
                                    required
                                >
                                    <option value="">Destination shop</option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min="1"
                                    className="border rounded-lg px-3 py-2"
                                    value={transferForm.data.quantity}
                                    onChange={(e) => transferForm.setData("quantity", Number(e.target.value))}
                                    required
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Transfer note"
                                className="w-full border rounded-lg px-3 py-2"
                                value={transferForm.data.note}
                                onChange={(e) => transferForm.setData("note", e.target.value)}
                            />
                            <button className="w-full bg-slate-900 text-white rounded-lg py-2 font-semibold">
                                Transfer Stock
                            </button>
                        </form>
                    </div>
                </div>

                {canManageShares && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5">
                        <h3 className="font-bold text-slate-800">Shop Share Permission (Admin)</h3>
                        <form onSubmit={submitShare} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select
                                className="border rounded-lg px-3 py-2"
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
                                className="border rounded-lg px-3 py-2"
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
                                className="border rounded-lg px-3 py-2"
                                value={shareForm.data.is_enabled ? "1" : "0"}
                                onChange={(e) => shareForm.setData("is_enabled", e.target.value === "1")}
                            >
                                <option value="1">Enabled</option>
                                <option value="0">Disabled</option>
                            </select>
                            <button className="bg-orange-600 text-white rounded-lg font-semibold">Save Permission</button>
                        </form>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {shares.map((share) => (
                                <div key={share.id} className="border border-slate-200 rounded-lg px-3 py-2">
                                    {share.from_shop?.name} → {share.to_shop?.name} :
                                    <span className={`ms-2 font-bold ${share.is_enabled ? "text-emerald-600" : "text-red-500"}`}>
                                        {share.is_enabled ? "Enabled" : "Disabled"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 font-bold text-slate-800">Current Stock</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-400 uppercase text-[11px] border-b border-slate-50">
                                    <th className="px-5 py-3">Shop</th>
                                    <th className="px-5 py-3">Product</th>
                                    <th className="px-5 py-3">Variant</th>
                                    <th className="px-5 py-3">Price</th>
                                    <th className="px-5 py-3">Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {variantRows.map((variant) => (
                                    <tr key={variant.id}>
                                        <td className="px-5 py-3">{variant.product?.shop?.name || "-"}</td>
                                        <td className="px-5 py-3">{variant.product?.name || "-"}</td>
                                        <td className="px-5 py-3 font-semibold">{variant.sku}</td>
                                        <td className="px-5 py-3">{Number(variant.price || 0).toLocaleString()} MMK</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${variant.stock_level <= 5 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                                                {variant.stock_level}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {variants?.links?.length > 1 && (
                        <div className="p-4 flex flex-wrap gap-2 border-t border-slate-50">
                            {variants.links.map((link, idx) => (
                                <Link
                                    key={`${link.label}-${idx}`}
                                    href={link.url || "#"}
                                    className={`px-3 py-1 rounded border text-sm ${link.active ? "bg-orange-600 text-white border-orange-600" : "bg-white text-slate-600 border-slate-200"} ${!link.url ? "opacity-50 pointer-events-none" : ""}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 font-bold text-slate-800">Recent Stock Transfers</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-400 uppercase text-[11px] border-b border-slate-50">
                                    <th className="px-5 py-3">Time</th>
                                    <th className="px-5 py-3">From</th>
                                    <th className="px-5 py-3">To</th>
                                    <th className="px-5 py-3">Variant</th>
                                    <th className="px-5 py-3">Qty</th>
                                    <th className="px-5 py-3">By</th>
                                    <th className="px-5 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transfers.length ? (
                                    transfers.map((transfer) => (
                                        <tr key={transfer.id}>
                                            <td className="px-5 py-3">{new Date(transfer.created_at).toLocaleString()}</td>
                                            <td className="px-5 py-3">{transfer.from_shop?.name || "-"}</td>
                                            <td className="px-5 py-3">{transfer.to_shop?.name || "-"}</td>
                                            <td className="px-5 py-3">{transfer.source_variant?.sku || "-"}</td>
                                            <td className="px-5 py-3 font-semibold">{transfer.quantity}</td>
                                            <td className="px-5 py-3">{transfer.initiator?.name || "System"}</td>
                                            <td className="px-5 py-3 uppercase">{transfer.status}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-10 text-center text-slate-400">No transfer logs yet.</td>
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
