import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export default function SalesDashboard({ stats, recentOrders, shop }) {
    return (
        <AdminLayout header="Sales Dashboard">
            <Head title="Sales Dashboard" />

            <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 text-white p-6 shadow">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                        Sales Desk
                    </p>
                    <h2 className="mt-2 text-2xl font-black">
                        {shop?.name || "Shop"} Sales Operations
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Today Orders" value={stats?.today_orders || 0} />
                    <StatCard label="Pending" value={stats?.pending_orders || 0} />
                    <StatCard label="Confirmed" value={stats?.confirmed_orders || 0} />
                    <StatCard label="Today Sales" value={`${stats?.today_sales || 0} MMK`} />
                </div>

                <Card>
                    <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Quick Actions</h3>
                        <Link
                            href={route("admin.orders.index")}
                            className="text-xs font-bold text-orange-600 uppercase tracking-widest"
                        >
                            Open Orders Board
                        </Link>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                        Pending orders ကိုအရင်စစ်ပြီး confirmed status ပြောင်းပေးပါ။
                    </p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader><CardTitle>Latest Orders</CardTitle></CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-slate-50">
                                    <TableHead>Order</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders?.length ? (
                                    recentOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-bold text-slate-700">#{order.id}</TableCell>
                                            <TableCell>{order.user?.name || "Unknown"}</TableCell>
                                            <TableCell className="font-semibold">
                                                {Number(order.total_amount).toLocaleString()} MMK
                                            </TableCell>
                                            <TableCell><Badge variant="info">{order.status}</Badge></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan="4" className="px-6 py-10 text-center text-slate-400">
                                            No orders yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-800">{value}</p>
        </div>
    );
}
