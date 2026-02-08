import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import Swal from "sweetalert2";

export default function Index({ categories }) {
    const [name, setName] = useState("");

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
        router.patch(route("admin.categories.update", id), { name: newName }, {
            onSuccess: () => Swal.fire("Updated", "Category updated.", "success"),
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                <h3 className="font-bold text-slate-800 mb-4">Create Category</h3>
                <form onSubmit={createCategory} className="flex gap-3">
                    <input
                        className="flex-1 border rounded-lg px-3 py-2"
                        placeholder="Category name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold">
                        Create
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-slate-800">Categories</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-50">
                                <th className="px-6 py-4 font-bold">Name</th>
                                <th className="px-6 py-4 font-bold">Slug</th>
                                <th className="px-6 py-4 font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {categories?.length ? (
                                categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                                        <td className="px-6 py-4">
                                            <input
                                                className="border rounded px-2 py-1 text-sm w-full"
                                                defaultValue={cat.name}
                                                onBlur={(e) =>
                                                    e.target.value && e.target.value !== cat.name
                                                        ? updateCategory(cat.id, e.target.value)
                                                        : null
                                                }
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {cat.slug}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => deleteCategory(cat.id)}
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
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
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="p-12 text-center text-slate-400 italic">
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
