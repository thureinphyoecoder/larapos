import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function Edit({ product, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        _method: "put",
        name: product.name || "",
        sku: product.sku || "",
        price: product.price || "",
        stock_level: product.stock_level || 0,
        category_id: product.category_id || "",
        description: product.description || "",
        image: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.products.update", product.id), {
            forceFormData: true,
            onSuccess: () =>
                Swal.fire("Success", "Product updated.", "success"),
            onError: () =>
                Swal.fire("Error", "Please check the form.", "error"),
        });
    };

    return (
        <AdminLayout header="Edit Product">
            <Head title="Edit Product" />

            <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold">Name</label>
                        <input
                            className="mt-1 w-full border rounded-lg px-3 py-2"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            required
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-semibold">SKU</label>
                            <input
                                className="mt-1 w-full border rounded-lg px-3 py-2"
                                value={data.sku}
                                onChange={(e) => setData("sku", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold">Price</label>
                            <input
                                type="number"
                                className="mt-1 w-full border rounded-lg px-3 py-2"
                                value={data.price}
                                onChange={(e) => setData("price", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold">Stock</label>
                            <input
                                type="number"
                                className="mt-1 w-full border rounded-lg px-3 py-2"
                                value={data.stock_level}
                                onChange={(e) =>
                                    setData("stock_level", e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold">Category</label>
                        <select
                            className="mt-1 w-full border rounded-lg px-3 py-2"
                            value={data.category_id}
                            onChange={(e) =>
                                setData("category_id", e.target.value)
                            }
                            required
                        >
                            <option value="">Select category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-semibold">Description</label>
                        <textarea
                            className="mt-1 w-full border rounded-lg px-3 py-2 h-28"
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold">Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="mt-1 w-full"
                            onChange={(e) =>
                                setData("image", e.target.files[0])
                            }
                        />
                        {product.image_path && (
                            <img
                                src={`/storage/${product.image_path}`}
                                alt={product.name}
                                className="mt-3 h-20 w-20 rounded object-cover border"
                            />
                        )}
                    </div>

                    <button
                        disabled={processing}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                        Update
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
