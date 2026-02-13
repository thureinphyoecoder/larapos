import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";
import { useEffect, useMemo, useState } from "react";

const statusTone = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    confirmed: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    refund_requested: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    refunded: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
    return_requested: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    returned: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

function formatMoney(amount) {
    return `${Number(amount || 0).toLocaleString()} MMK`;
}

function buildOsmEmbedUrl(lat, lng) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const delta = 0.01;
    const left = (longitude - delta).toFixed(6);
    const right = (longitude + delta).toFixed(6);
    const top = (latitude + delta).toFixed(6);
    const bottom = (latitude - delta).toFixed(6);

    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export default function Show({ order }) {
    const { auth } = usePage().props;
    const role = auth?.role || "user";
    const canAccessPaymentSlip = ["admin", "manager", "accountant"].includes(role);
    const canManageOrderStatus = ["admin", "manager"].includes(role);
    const [liveOrder, setLiveOrder] = useState(order);
    const [showSlip, setShowSlip] = useState(false);
    const [deliveryProof, setDeliveryProof] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    const [locationError, setLocationError] = useState("");
    const syncLiveOrderFromPage = (page) => {
        const latestOrder = page?.props?.order;
        if (latestOrder) {
            setLiveOrder(latestOrder);
        }
    };

    const items = liveOrder?.items || [];
    const customer = liveOrder?.user;
    const status = (liveOrder?.status || "pending").toLowerCase();

    const orderTotal = useMemo(
        () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
        [items],
    );

    const confirmAndRun = (newStatus) => {
        const isCancel = newStatus === "cancelled";
        Swal.fire({
            title: "Confirm status change",
            text: `Change order status to ${newStatus}?`,
            icon: "warning",
            input: isCancel ? "textarea" : undefined,
            inputLabel: isCancel ? "Cancellation reason" : undefined,
            inputPlaceholder: isCancel ? "Please enter cancel reason..." : undefined,
            inputValidator: isCancel
                ? (value) => {
                    if (!value || value.trim().length < 5) {
                        return "Please enter at least 5 characters.";
                    }
                    return null;
                }
                : undefined,
            showCancelButton: true,
            confirmButtonText: "Yes, update",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.patch(
                route("admin.orders.updateStatus", order.id),
                {
                    status: newStatus,
                    ...(isCancel ? { cancel_reason: result.value || "" } : {}),
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setLiveOrder((prev) => ({ ...prev, status: newStatus }));
                        Swal.fire("Updated", `Order marked as ${newStatus}.`, "success");
                    },
                },
            );
        });
    };

    const saveDeliveryLocation = (lat, lng) => {
        router.patch(
            route("admin.orders.updateLocation", order.id),
            { delivery_lat: lat, delivery_lng: lng },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLiveOrder((prev) => ({
                        ...prev,
                        delivery_lat: lat,
                        delivery_lng: lng,
                        delivery_updated_at: new Date().toISOString(),
                    }));
                    Swal.fire("Updated", "Current GPS location saved.", "success");
                },
                onError: () => Swal.fire("Error", "Failed to save location.", "error"),
                onFinish: () => setIsLocating(false),
            },
        );
    };

    const captureCurrentLocation = () => {
        if (isUploadingProof) return;
        setLocationError("");

        if (!navigator.geolocation) {
            setLocationError("This browser does not support GPS location.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = Number(position.coords.latitude.toFixed(7));
                const lng = Number(position.coords.longitude.toFixed(7));
                saveDeliveryLocation(lat, lng);
            },
            (error) => {
                setIsLocating(false);
                if (error.code === 1) {
                    setLocationError("Location permission denied. Please allow GPS access.");
                    return;
                }
                if (error.code === 2) {
                    setLocationError("Location unavailable. Please check GPS/network.");
                    return;
                }
                if (error.code === 3) {
                    setLocationError("Location request timed out. Try again.");
                    return;
                }
                setLocationError("Could not read current location.");
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 10000,
            },
        );
    };

    useEffect(() => {
        if (!window.Echo || !order?.id) return;

        const channel = `order.${order.id}`;
        window.Echo.channel(channel).listen(".OrderStatusUpdated", (e) => {
            setLiveOrder((prev) => ({
                ...prev,
                status: e.status,
                delivery_proof_path: e.delivery_proof_path,
                delivery_lat: e.delivery_lat,
                delivery_lng: e.delivery_lng,
                delivery_updated_at: e.delivery_updated_at,
            }));
        });

        return () => {
            window.Echo.leaveChannel(channel);
        };
    }, [order?.id]);

    useEffect(() => {
        setLiveOrder(order);
    }, [order]);

    return (
        <AdminLayout header={`Order #${order?.id || ""}`}>
            <Head title={`Order #${order?.id || ""}`} />

            <div className="mx-auto max-w-7xl space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Order Overview</p>
                            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">Order #{order?.id}</h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Created {order?.created_at ? new Date(order.created_at).toLocaleString() : "Unknown time"}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusTone[status] || "bg-slate-100 text-slate-600"}`}>
                                {status}
                            </span>
                            <Link
                                href={route("admin.orders.index")}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Back to Orders
                            </Link>
                        </div>
                    </div>

                    {canManageOrderStatus && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {status === "pending" && (
                                <ActionButton tone="green" onClick={() => confirmAndRun("confirmed")} label="Confirm Order" />
                            )}
                            {status === "confirmed" && (
                                <ActionButton tone="blue" onClick={() => confirmAndRun("shipped")} label="Mark Shipped" />
                            )}
                            {status === "shipped" && (
                                <ActionButton tone="indigo" onClick={() => confirmAndRun("delivered")} label="Mark Delivered" />
                            )}
                            {status === "refund_requested" && (
                                <ActionButton tone="violet" onClick={() => confirmAndRun("refunded")} label="Mark Refunded" />
                            )}
                            {status === "return_requested" && (
                                <ActionButton tone="amber" onClick={() => confirmAndRun("returned")} label="Mark Returned" />
                            )}
                            {!['cancelled', 'returned', 'refunded', 'delivered'].includes(status) && (
                                <ActionButton tone="red" onClick={() => confirmAndRun("cancelled")} label="Cancel Order" />
                            )}
                        </div>
                    )}
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2 space-y-6">
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Ordered Items</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/70">
                                        <tr className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            <th className="px-5 py-3 font-bold">Product</th>
                                            <th className="px-5 py-3 font-bold">Qty</th>
                                            <th className="px-5 py-3 font-bold">Unit Price</th>
                                            <th className="px-5 py-3 font-bold text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {items.length ? (
                                            items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{item.product?.name || "Product not available"}</td>
                                                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">x {item.quantity}</td>
                                                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatMoney(item.price)}</td>
                                                    <td className="px-5 py-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="p-8 text-center text-slate-400 dark:text-slate-500">No items found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm dark:border-slate-700">
                                <span className="font-semibold text-slate-600 dark:text-slate-300">Calculated Total</span>
                                <span className="text-lg font-black text-orange-600">{formatMoney(orderTotal)}</span>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Delivery Tracking</h3>
                            {liveOrder?.delivery_lat && liveOrder?.delivery_lng ? (
                                <>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        Current location: {liveOrder.delivery_lat}, {liveOrder.delivery_lng}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                        Last update: {liveOrder.delivery_updated_at ? new Date(liveOrder.delivery_updated_at).toLocaleString() : "Not available"}
                                    </p>
                                    <div className="mt-3">
                                        <iframe
                                            title="delivery-map"
                                            className="h-56 w-full rounded-xl border"
                                            src={buildOsmEmbedUrl(
                                                liveOrder.delivery_lat,
                                                liveOrder.delivery_lng,
                                            )}
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">No location update yet.</p>
                            )}

                            {["admin", "manager", "delivery"].includes(role) && (
                                <div className="mt-4 space-y-3">
                                    <button
                                        type="button"
                                        onClick={captureCurrentLocation}
                                        disabled={isLocating || isUploadingProof}
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isLocating ? "Getting current GPS..." : "Use Current Location"}
                                    </button>
                                    {locationError && (
                                        <p className="text-xs text-rose-600 font-medium">{locationError}</p>
                                    )}
                                    {liveOrder?.delivery_lat && liveOrder?.delivery_lng && (
                                        <a
                                            href={`https://www.openstreetmap.org/?mlat=${liveOrder.delivery_lat}&mlon=${liveOrder.delivery_lng}#map=16/${liveOrder.delivery_lat}/${liveOrder.delivery_lng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex text-xs font-semibold text-sky-600 hover:underline"
                                        >
                                            Open full map
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Customer Info</h3>
                            <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                <p><span className="font-semibold">Name:</span> {customer?.name || "Customer not set"}</p>
                                <p><span className="font-semibold">Phone:</span> {liveOrder?.phone || "Not provided"}</p>
                                <p><span className="font-semibold">Address:</span> {liveOrder?.address || "Not provided"}</p>
                            </div>
                        </div>

                        {status === "cancelled" && liveOrder?.cancel_reason && (
                            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                                <h3 className="text-lg font-black text-rose-700">Cancel Reason</h3>
                                <p className="mt-2 text-sm text-rose-800">{liveOrder.cancel_reason}</p>
                            </div>
                        )}

                        {canAccessPaymentSlip && (
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Payment Slip</h3>
                                {liveOrder?.payment_slip ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowSlip(true)}
                                        className="mt-3 block w-full"
                                    >
                                        <img
                                            src={`/storage/${liveOrder.payment_slip}`}
                                            className="w-full rounded-xl border hover:opacity-90 transition"
                                            alt="Payment Slip"
                                        />
                                    </button>
                                ) : (
                                    <div className="mt-3 flex h-40 items-center justify-center rounded-xl border bg-slate-50 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                                        No slip uploaded
                                    </div>
                                )}
                            </div>
                        )}

                        {canAccessPaymentSlip && (
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Slip Verification</h3>
                                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                    <p><span className="font-semibold">Verdict:</span> {liveOrder?.slip_verdict || "Not checked"}</p>
                                    <p><span className="font-semibold">Score:</span> {liveOrder?.slip_score ?? "-"}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Checked at: {liveOrder?.slip_checked_at ? new Date(liveOrder.slip_checked_at).toLocaleString() : "Not available"}
                                    </p>
                                </div>
                                <button
                                    className="mt-4 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                                    disabled={!liveOrder?.payment_slip}
                                    onClick={() =>
                                        Swal.fire({
                                            title: "Verify slip?",
                                            text: "This will run OCR and rules.",
                                            icon: "warning",
                                            showCancelButton: true,
                                            confirmButtonText: "Run verify",
                                        }).then((result) => {
                                            if (!result.isConfirmed) return;
                                            router.post(route("admin.orders.verifySlip", order.id), {}, {
                                                preserveScroll: true,
                                                onSuccess: (page) => {
                                                    syncLiveOrderFromPage(page);
                                                    Swal.fire("Done", "Slip verification completed.", "success");
                                                },
                                            });
                                        })
                                    }
                                >
                                    Verify Slip
                                </button>
                            </div>
                        )}

                        {["admin", "manager", "delivery"].includes(role) && (
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Shipment Confirmation</h3>
                                {liveOrder?.delivery_proof_path ? (
                                    <a
                                        href={`/storage/${liveOrder.delivery_proof_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 inline-flex text-sm font-semibold text-sky-600 hover:underline"
                                    >
                                        View uploaded proof image
                                    </a>
                                ) : (
                                    <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">No proof uploaded yet.</p>
                                )}

                                <div className="mt-4 space-y-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setDeliveryProof(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-500/10 dark:file:text-sky-300 dark:hover:file:bg-sky-500/20"
                                    />
                                    <button
                                        type="button"
                                        disabled={!deliveryProof || isUploadingProof || isLocating}
                                        onClick={() => {
                                            if (!deliveryProof || isUploadingProof) return;
                                            setIsUploadingProof(true);
                                            router.post(
                                                route("admin.orders.confirmShipment", order.id),
                                                { delivery_proof: deliveryProof },
                                                {
                                                    forceFormData: true,
                                                    preserveScroll: true,
                                                    onSuccess: (page) => {
                                                        syncLiveOrderFromPage(page);
                                                        setDeliveryProof(null);
                                                        Swal.fire("Uploaded", "Delivery proof uploaded and order marked shipped.", "success");
                                                    },
                                                    onError: () => {
                                                        Swal.fire("Error", "Could not upload proof. Please try again.", "error");
                                                    },
                                                    onFinish: () => {
                                                        setIsUploadingProof(false);
                                                    },
                                                },
                                            );
                                        }}
                                        className={`w-full rounded-xl py-2 text-sm font-bold ${
                                            !deliveryProof || isUploadingProof || isLocating
                                                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                                                : "bg-sky-600 text-white hover:bg-sky-700"
                                        }`}
                                    >
                                        {isUploadingProof ? "Uploading proof..." : "Upload & Confirm Shipped"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {canAccessPaymentSlip && showSlip && liveOrder?.payment_slip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowSlip(false)}>
                    <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">Payment Slip</h4>
                            <button className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => setShowSlip(false)}>Close</button>
                        </div>
                        <img src={`/storage/${liveOrder.payment_slip}`} className="w-full rounded-lg border dark:border-slate-700" alt="Payment Slip" />
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function ActionButton({ tone = "green", label, onClick }) {
    const toneClass = {
        green: "bg-emerald-600 hover:bg-emerald-700",
        blue: "bg-sky-600 hover:bg-sky-700",
        indigo: "bg-indigo-600 hover:bg-indigo-700",
        violet: "bg-violet-600 hover:bg-violet-700",
        amber: "bg-amber-600 hover:bg-amber-700",
        red: "bg-rose-600 hover:bg-rose-700",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition ${toneClass[tone] || toneClass.green}`}
        >
            {label}
        </button>
    );
}
