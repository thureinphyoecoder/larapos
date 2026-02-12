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
                    className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm md:grid-cols-5 dark:border-slate-700 dark:bg-slate-900/70"
                    onSubmit={(e) => {
                        e.preventDefault();
                        window.location.href = route("admin.stock-movements.index", {
                            q: q || undefined,
                            event_type: eventType || undefined,
                            shop_id: shopId || undefined,
                        });
                    }}
                >
                    <input className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/40" placeholder="Search product/sku/note" value={q} onChange={(e) => setQ(e.target.value)} />
                    <select className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/40" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                        <option value="">All events</option>
                        <option value="sale">Sale</option>
                        <option value="transfer">Transfer</option>
                        <option value="adjust">Adjust</option>
                        <option value="receive">Receive</option>
                        <option value="consume">Consume</option>
                    </select>
                    <select className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/40" value={shopId} onChange={(e) => setShopId(e.target.value)}>
                        <option value="">All shops</option>
                        {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                    </select>
                    <button className="rounded-xl bg-sky-600 font-bold text-white transition hover:bg-sky-500">Apply</button>
                    <a href={route("admin.stock-movements.index")} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">Reset</a>
                </form>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
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
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {rows.map((row) => (
                                <tr key={row.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(row.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs font-bold uppercase text-slate-700 dark:text-slate-300">{row.event_type}</td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.shop?.name || "-"}</td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.product?.name || "-"}</td>
                                    <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{row.variant?.sku || "-"}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{row.quantity}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.actor?.name || "system"}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.note || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
