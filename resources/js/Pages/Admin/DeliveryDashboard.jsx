import React from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export default function DeliveryDashboard({ stats, deliveryOrders = [], shop }) {
    return (
        <AdminLayout header="Rider Dashboard">
            <Head title="Rider Dashboard" />

            <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-r from-sky-700 to-cyan-500 text-white p-6 shadow">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                        Rider Hub
                    </p>
                    <h2 className="mt-2 text-2xl font-black">
                        {shop?.name || "All Shops"} Rider Tracking
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Assigned" value={stats?.assigned_orders || 0} />
                    <StatCard label="In Transit" value={stats?.in_transit || 0} />
                    <StatCard label="Delivered Today" value={stats?.delivered_today || 0} />
                    <StatCard label="Need Location Update" value={stats?.location_updates_needed || 0} />
                </div>

                <Card>
                    <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Delivery Actions</h3>
                        <Link
                            href={route("admin.orders.index")}
                            className="text-xs font-bold text-sky-600 uppercase tracking-widest"
                        >
                            Open Delivery Orders
                        </Link>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                        Shipped orders တွေကို location update ပုံမှန်လုပ်ပေးပြီး delivered status ပြောင်းပါ။
                    </p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader><CardTitle>Delivery Orders</CardTitle></CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-slate-50">
                                    <TableHead>Order</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deliveryOrders.length ? (
                                    deliveryOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-bold text-slate-700">#{order.id}</TableCell>
                                            <TableCell>{order.user?.name || "Unknown"}</TableCell>
                                            <TableCell className="max-w-xs truncate">{order.address || "-"}</TableCell>
                                            <TableCell><Badge variant="info">{order.status}</Badge></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan="4" className="px-6 py-10 text-center text-slate-400">
                                            No delivery orders yet.
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
