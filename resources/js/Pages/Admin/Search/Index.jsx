import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";

export default function SearchIndex({ q = "", results = {} }) {
    const products = results?.products || [];
    const variants = results?.variants || [];
    const orders = results?.orders || [];
    const users = results?.users || [];

    return (
        <AdminLayout header="Global Search">
            <Head title="Global Search" />

            <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Global Search</p>
                    <h1 className="mt-2 text-2xl font-black text-slate-900">Results for: "{q || "all records"}"</h1>
                    <p className="mt-1 text-sm text-slate-500">Products, variants, orders and staff/users in one place.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <ResultCard title="Products" count={products.length}>
                        {products.map((item) => (
                            <Link key={item.id} href={route("admin.products.edit", item.id)} className="block p-3 rounded-lg hover:bg-slate-50 border border-slate-100">
                                <p className="font-semibold text-slate-800">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.sku} | {item.shop?.name || "Shop not assigned"}</p>
                            </Link>
                        ))}
                    </ResultCard>

                    <ResultCard title="Variants" count={variants.length}>
                        {variants.map((item) => (
                            <div key={item.id} className="p-3 rounded-lg border border-slate-100">
                                <p className="font-semibold text-slate-800">{item.sku}</p>
                                <p className="text-xs text-slate-500">{item.product?.name} | {item.product?.shop?.name}</p>
                            </div>
                        ))}
                    </ResultCard>

                    <ResultCard title="Orders" count={orders.length}>
                        {orders.map((item) => (
                            <Link key={item.id} href={route("admin.orders.show", item.id)} className="block p-3 rounded-lg hover:bg-slate-50 border border-slate-100">
                                <p className="font-semibold text-slate-800">Order #{item.id}</p>
                                <p className="text-xs text-slate-500">{item.status} | {item.shop?.name || "Shop not assigned"}</p>
                            </Link>
                        ))}
                    </ResultCard>

                    <ResultCard title="Users" count={users.length}>
                        {users.map((item) => (
                            <div key={item.id} className="p-3 rounded-lg border border-slate-100">
                                <p className="font-semibold text-slate-800">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.email} | {item.shop?.name || "Shop not assigned"}</p>
                            </div>
                        ))}
                    </ResultCard>
                </div>
            </div>
        </AdminLayout>
    );
}

function ResultCard({ title, count, children }) {
    return (
        <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">{title}</h3>
                <span className="text-xs font-semibold text-slate-500">{count}</span>
            </div>
            <div className="p-4 space-y-2 max-h-[420px] overflow-auto">{children.length ? children : <p className="text-sm text-slate-400">No results.</p>}</div>
        </section>
    );
}
