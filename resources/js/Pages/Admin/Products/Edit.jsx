import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function Edit({ product, categories }) {
    const existingVariants = product.variants?.length
        ? product.variants.map((variant) => ({
              id: variant.id,
              label: (variant.sku || "").split("-").pop() || `Variant ${variant.id}`,
              sku: variant.sku || "",
              price: variant.price || "",
              stock_level: variant.stock_level || 0,
              is_active: Boolean(variant.is_active),
          }))
        : [{ label: "REG", sku: "", price: "", stock_level: 0, is_active: true }];

    const { data, setData, post, processing, errors } = useForm({
        _method: "put",
        name: product.name || "",
        sku: product.sku || "",
        category_id: product.category_id || "",
        description: product.description || "",
        image: null,
        variants: existingVariants,
    });

    const updateVariant = (index, field, value) => {
        const next = [...data.variants];
        next[index] = { ...next[index], [field]: value };
        setData("variants", next);
    };

    const addVariant = () => {
        setData("variants", [
            ...data.variants,
            { label: `OPTION ${data.variants.length + 1}`, sku: "", price: "", stock_level: 0, is_active: true },
        ]);
    };

    const removeVariant = (index) => {
        if (data.variants.length <= 1) {
            Swal.fire("Warning", "At least one variant is required.", "warning");
            return;
        }

        setData(
            "variants",
            data.variants.filter((_, idx) => idx !== index),
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.products.update", product.id), {
            forceFormData: true,
            onSuccess: () => Swal.fire("Success", "Product updated.", "success"),
            onError: () => Swal.fire("Error", "Please check variants and form fields.", "error"),
        });
    };

    return (
        <AdminLayout header="Edit Product">
            <Head title="Edit Product" />

            <div className="max-w-5xl bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label className="text-sm font-semibold">Name</label>
                        <input
                            className="mt-1 w-full border rounded-lg px-3 py-2"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            required
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold">Base SKU (optional)</label>
                            <input
                                className="mt-1 w-full border rounded-lg px-3 py-2"
                                value={data.sku}
                                onChange={(e) => setData("sku", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold">Category</label>
                            <select
                                className="mt-1 w-full border rounded-lg px-3 py-2"
                                value={data.category_id}
                                onChange={(e) => setData("category_id", e.target.value)}
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
                    </div>

                    <div>
                        <label className="text-sm font-semibold">Description</label>
                        <textarea
                            className="mt-1 w-full border rounded-lg px-3 py-2 h-28"
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold">Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="mt-1 w-full"
                            onChange={(e) => setData("image", e.target.files[0])}
                        />
                        {product.image_path && (
                            <img
                                src={`/storage/${product.image_path}`}
                                alt={product.name}
                                className="mt-3 h-20 w-20 rounded object-cover border"
                            />
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Variants</h3>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white"
                            >
                                Add Variant
                            </button>
                        </div>

                        {data.variants.map((variant, index) => (
                            <div key={variant.id || index} className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                                <div className="lg:col-span-3">
                                    <label className="text-xs font-semibold text-slate-500">Label</label>
                                    <input
                                        className="mt-1 w-full border rounded-lg px-3 py-2"
                                        value={variant.label}
                                        onChange={(e) => updateVariant(index, "label", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="lg:col-span-3">
                                    <label className="text-xs font-semibold text-slate-500">Variant SKU</label>
                                    <input
                                        className="mt-1 w-full border rounded-lg px-3 py-2"
                                        value={variant.sku}
                                        onChange={(e) => updateVariant(index, "sku", e.target.value)}
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-semibold text-slate-500">Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="mt-1 w-full border rounded-lg px-3 py-2"
                                        value={variant.price}
                                        onChange={(e) => updateVariant(index, "price", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-semibold text-slate-500">Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="mt-1 w-full border rounded-lg px-3 py-2"
                                        value={variant.stock_level}
                                        onChange={(e) => updateVariant(index, "stock_level", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="lg:col-span-1 flex items-end">
                                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(variant.is_active)}
                                            onChange={(e) => updateVariant(index, "is_active", e.target.checked)}
                                        />
                                        Active
                                    </label>
                                </div>
                                <div className="lg:col-span-1 flex items-end justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        className="text-xs font-bold text-red-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                        {errors.variants && <p className="text-red-500 text-xs">{errors.variants}</p>}
                    </div>

                    <button disabled={processing} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold">
                        Update Product
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
