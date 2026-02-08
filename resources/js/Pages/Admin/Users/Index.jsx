import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Index({ users, roles, shops, type = "staff", search = "" }) {
    const { auth } = usePage().props;
    const role = auth?.role || "admin";
    const canManageUsers = ["admin", "manager"].includes(role);
    const canDeleteUsers = role === "admin";
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "manager",
        shop_id: "",
    });
    const [query, setQuery] = useState(search);

    const staffRoles = ["manager", "sales", "delivery"];
    const rows = users?.data || [];

    const createStaff = (e) => {
        e.preventDefault();
        router.post(route("admin.users.store"), form, {
            onSuccess: () =>
                Swal.fire("Success", "Staff created.", "success"),
            onError: () =>
                Swal.fire("Error", "Please check the form.", "error"),
        });
    };

    const updateUser = (userId, role, shopId) => {
        Swal.fire({
            title: "Confirm",
            text: "Update this user?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Update",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.patch(route("admin.users.update", userId), {
                role,
                shop_id: shopId || null,
            }, {
                onSuccess: () =>
                    Swal.fire("Updated", "User updated.", "success"),
            });
        });
    };

    const deleteUser = (userId) => {
        Swal.fire({
            title: "Delete user?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.delete(route("admin.users.destroy", userId), {
                onSuccess: () =>
                    Swal.fire("Deleted", "User removed.", "success"),
            });
        });
    };

    return (
        <AdminLayout header="Users & Staff">
            <Head title="Admin Users" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex gap-2">
                    <Link
                        href={route("admin.users.index", { type: "staff", search: query || undefined })}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${type === "staff" ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                        Staff
                    </Link>
                    <Link
                        href={route("admin.users.index", { type: "customers", search: query || undefined })}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${type === "customers" ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                        Customers
                    </Link>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get(route("admin.users.index"), { type, search: query || undefined }, { preserveState: true, replace: true });
                    }}
                    className="flex items-center gap-2"
                >
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        className="border rounded-lg px-3 py-2 text-sm w-64"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm">
                        Search
                    </button>
                </form>
            </div>

            {type === "staff" && canManageUsers && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                    <h3 className="font-bold text-slate-800 mb-4">
                        Create Staff
                    </h3>
                    <form onSubmit={createStaff} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input
                            type="text"
                            placeholder="Name"
                            className="border rounded-lg px-3 py-2"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            className="border rounded-lg px-3 py-2"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password (optional)"
                            className="border rounded-lg px-3 py-2"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <select
                            className="border rounded-lg px-3 py-2"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                        >
                            {roles.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                        <select
                            className="border rounded-lg px-3 py-2"
                            value={form.shop_id}
                            onChange={(e) => setForm({ ...form, shop_id: e.target.value })}
                            disabled={!staffRoles.includes(form.role)}
                        >
                            <option value="">Select shop</option>
                            {shops.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <div className="md:col-span-5">
                            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">
                        {type === "staff" ? "Staff" : "Customers"}
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-50">
                                <th className="px-6 py-4 font-bold">Name</th>
                                <th className="px-6 py-4 font-bold">Email</th>
                                <th className="px-6 py-4 font-bold">Role</th>
                                {type === "staff" && <th className="px-6 py-4 font-bold">Shop</th>}
                                {type === "staff" && <th className="px-6 py-4 font-bold">Active Time</th>}
                                <th className="px-6 py-4 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rows.length ? (
                                rows.map((user) => {
                                    const currentRole = user.roles?.[0]?.name || "customer";
                                    return (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-slate-50/80 transition"
                                        >
                                            <td className="px-6 py-4 font-semibold text-slate-700 text-sm">
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {type === "staff" && canManageUsers ? (
                                                    <select
                                                        className="border rounded-lg px-2 py-1"
                                                        defaultValue={currentRole}
                                                        onChange={(e) =>
                                                            updateUser(user.id, e.target.value, user.shop_id)
                                                        }
                                                    >
                                                        {roles.map((r) => (
                                                            <option key={r} value={r}>
                                                                {r}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-slate-500">
                                                        {currentRole}
                                                    </span>
                                                )}
                                            </td>
                                            {type === "staff" && (
                                                <>
                                                    <td className="px-6 py-4 text-sm">
                                                        {canManageUsers ? (
                                                            <select
                                                                className="border rounded-lg px-2 py-1"
                                                                defaultValue={user.shop_id || ""}
                                                                onChange={(e) =>
                                                                    updateUser(user.id, currentRole, e.target.value)
                                                                }
                                                                disabled={!staffRoles.includes(currentRole)}
                                                            >
                                                                <option value="">Select shop</option>
                                                                {shops.map((s) => (
                                                                    <option key={s.id} value={s.id}>
                                                                        {s.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <span>{user.shop?.name || "N/A"}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {Math.floor((user.attendance_today?.worked_minutes || 0) / 60)}h {(user.attendance_today?.worked_minutes || 0) % 60}m
                                                        <span className={`ms-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.attendance_today?.checked_in ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                                            {user.attendance_today?.checked_in ? "On Duty" : "Off"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {canDeleteUsers ? (
                                                            <button
                                                                onClick={() => deleteUser(user.id)}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                                title="Delete user"
                                                                aria-label="Delete user"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-4 w-4"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6-1a1 1 0 10-2 0v7a1 1 0 102 0V7zm-7-3a2 2 0 012-2h6a2 2 0 012 2v1h2a1 1 0 110 2h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 010-2h2V4z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-400">No permission</span>
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                            {type !== "staff" && (
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {canDeleteUsers ? (
                                                        <button
                                                            onClick={() => deleteUser(user.id)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                            title="Delete user"
                                                            aria-label="Delete user"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6-1a1 1 0 10-2 0v7a1 1 0 102 0V7zm-7-3a2 2 0 012-2h6a2 2 0 012 2v1h2a1 1 0 110 2h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 010-2h2V4z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400">No permission</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={type === "staff" ? 6 : 4}
                                        className="p-12 text-center text-slate-400 italic"
                                    >
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {users?.links?.length > 1 && (
                <div className="mt-6 flex flex-wrap gap-2">
                    {users.links.map((link, idx) => (
                        <Link
                            key={`${link.label}-${idx}`}
                            href={link.url || "#"}
                            className={`px-3 py-1 rounded border text-sm ${
                                link.active
                                    ? "bg-orange-600 text-white border-orange-600"
                                    : "bg-white text-slate-600 border-slate-200"
                            } ${!link.url ? "opacity-50 pointer-events-none" : ""}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
