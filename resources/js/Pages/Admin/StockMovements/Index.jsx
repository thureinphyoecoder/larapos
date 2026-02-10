import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { useState } from "react";

export default function StockMovementsIndex({ movements, shops = [], filters = {} }) {
    const [q, setQ] = useState(filters?.q || "");
    const [eventType, setEventType] = useState(filters?.event_type || "");
    const [shopId, setShopId] = useState(filters?.shop_id ? String(filters.shop_id) : "");

    const rows = movements?.data || [];

    return (
        <AdminLayout header="Stock Movement Logs">
            <Head title="Stock Movements" />

            <div className="space-y-5">
                <form
                    className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        window.location.href = route("admin.stock-movements.index", {
                            q: q || undefined,
                            event_type: eventType || undefined,
                            shop_id: shopId || undefined,
                        });
                    }}
                >
                    <input className="border border-slate-300 rounded-xl px-3 py-2.5" placeholder="Search product/sku/note" value={q} onChange={(e) => setQ(e.target.value)} />
                    <select className="border border-slate-300 rounded-xl px-3 py-2.5" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                        <option value="">All events</option>
                        <option value="sale">Sale</option>
                        <option value="transfer">Transfer</option>
                        <option value="adjust">Adjust</option>
                        <option value="receive">Receive</option>
                        <option value="consume">Consume</option>
                    </select>
                    <select className="border border-slate-300 rounded-xl px-3 py-2.5" value={shopId} onChange={(e) => setShopId(e.target.value)}>
                        <option value="">All shops</option>
                        {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                    </select>
                    <button className="bg-slate-900 text-white rounded-xl font-bold">Apply</button>
                    <a href={route("admin.stock-movements.index")} className="text-center border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-600">Reset</a>
                </form>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left">Time</th>
                                <th className="px-4 py-3 text-left">Event</th>
                                <th className="px-4 py-3 text-left">Shop</th>
                                <th className="px-4 py-3 text-left">Product</th>
                                <th className="px-4 py-3 text-left">Variant SKU</th>
                                <th className="px-4 py-3 text-left">Qty</th>
                                <th className="px-4 py-3 text-left">Actor</th>
                                <th className="px-4 py-3 text-left">Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-3 uppercase text-xs font-bold">{row.event_type}</td>
                                    <td className="px-4 py-3">{row.shop?.name || "-"}</td>
                                    <td className="px-4 py-3">{row.product?.name || "-"}</td>
                                    <td className="px-4 py-3">{row.variant?.sku || "-"}</td>
                                    <td className="px-4 py-3 font-semibold">{row.quantity}</td>
                                    <td className="px-4 py-3">{row.actor?.name || "system"}</td>
                                    <td className="px-4 py-3">{row.note || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
