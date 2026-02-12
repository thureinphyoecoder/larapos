import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Index({ categories }) {
    const [name, setName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");

    const createCategory = (e) => {
        e.preventDefault();
        router.post(route("admin.categories.store"), { name }, {
            onSuccess: () => {
                setName("");
                Swal.fire("Success", "Category created.", "success");
            },
            onError: () => Swal.fire("Error", "Please check the form.", "error"),
        });
    };

    const updateCategory = (id, newName) => {
        if (!newName?.trim()) {
            Swal.fire("Error", "Category name is required.", "error");
            return;
        }

        router.patch(route("admin.categories.update", id), { name: newName }, {
            onSuccess: () => {
                setEditingId(null);
                setEditingName("");
                Swal.fire("Updated", "Category updated.", "success");
            },
        });
    };

    const deleteCategory = (id) => {
        Swal.fire({
            title: "Delete category?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.delete(route("admin.categories.destroy", id), {
                onSuccess: () => Swal.fire("Deleted", "Category removed.", "success"),
            });
        });
    };

    return (
        <AdminLayout header="Categories">
            <Head title="Admin Categories" />

            <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <h3 className="mb-4 text-lg font-black text-slate-900 dark:text-slate-100">Create Category</h3>
                <form onSubmit={createCategory} className="flex gap-3">
                    <input
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/40"
                        placeholder="Category name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <button className="rounded-xl bg-sky-600 px-4 py-2.5 font-bold text-white transition hover:bg-sky-500">
                        Create
                    </button>
                </form>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <div className="border-b border-slate-100 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/80">
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Categories</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/70">
                            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                <th className="px-6 py-4 font-bold">Name</th>
                                <th className="px-6 py-4 font-bold">Slug</th>
                                <th className="px-6 py-4 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {categories?.length ? (
                                categories.map((cat) => (
                                    <tr key={cat.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            {editingId === cat.id ? (
                                                <input
                                                    className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {cat.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {cat.slug}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                {editingId === cat.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => updateCategory(cat.id, editingName)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                                                            title="Save category"
                                                            aria-label="Save category"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.436a1 1 0 111.414-1.414l3.929 3.928 6.657-6.657a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setEditingName("");
                                                            }}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                                            title="Cancel"
                                                            aria-label="Cancel"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(cat.id);
                                                            setEditingName(cat.name);
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                                                        title="Edit category"
                                                        aria-label="Edit category"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M17.414 2.586a2 2 0 010 2.828l-8.19 8.19a2 2 0 01-.878.513l-3.2.914a1 1 0 01-1.236-1.236l.914-3.2a2 2 0 01.513-.878l8.19-8.19a2 2 0 012.828 0z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteCategory(cat.id)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                                                    title="Delete category"
                                                    aria-label="Delete category"
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
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="p-12 text-center italic text-slate-400 dark:text-slate-500">
                                        No categories yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
