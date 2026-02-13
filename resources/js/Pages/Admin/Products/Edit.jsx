import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import Swal from "sweetalert2";

function formatDateTimeLocal(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (num) => String(num).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const ii = pad(date.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${ii}`;
}

export default function Edit({ product, categories }) {
    const existingVariants = product.variants?.length
        ? product.variants.map((variant) => ({
              id: variant.id,
              label: (variant.sku || "").split("-").pop() || `Variant ${variant.id}`,
              sku: variant.sku || "",
              price: variant.price || "",
              stock_level: variant.stock_level || 0,
              is_active: Boolean(variant.is_active),
              promo_type: variant.promo_type || "",
              promo_value_type: variant.promo_value_type || "percent",
              promo_value: variant.promo_value ?? "",
              promo_label: variant.promo_label || "",
              promo_starts_at: variant.promo_starts_at ? formatDateTimeLocal(variant.promo_starts_at) : "",
              promo_ends_at: variant.promo_ends_at ? formatDateTimeLocal(variant.promo_ends_at) : "",
          }))
        : [{
              label: "REG",
              sku: "",
              price: "",
              stock_level: 0,
              is_active: true,
              promo_type: "",
              promo_value_type: "percent",
              promo_value: "",
              promo_label: "",
              promo_starts_at: "",
              promo_ends_at: "",
          }];

    const { data, setData, post, processing, errors } = useForm({
        _method: "put",
        name: product.name || "",
        sku: product.sku || "",
        category_id: product.category_id || "",
        description: product.description || "",
        is_hero: Boolean(product.is_hero),
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
            {
                label: `OPTION ${data.variants.length + 1}`,
                sku: "",
                price: "",
                stock_level: 0,
                is_active: true,
                promo_type: "",
                promo_value_type: "percent",
                promo_value: "",
                promo_label: "",
                promo_starts_at: "",
                promo_ends_at: "",
            },
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

            <div className="max-w-5xl rounded-2xl border border-slate-100 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100">
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label className="text-sm font-semibold">Name</label>
                        <input
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                value={data.sku}
                                onChange={(e) => setData("sku", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold">Category</label>
                            <select
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 h-28"
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

                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={Boolean(data.is_hero)}
                            onChange={(e) => setData("is_hero", e.target.checked)}
                        />
                        Use as Hero Product
                    </label>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4 dark:border-slate-700 dark:bg-slate-800/70">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Variants</h3>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white"
                            >
                                Add Variant
                            </button>
                        </div>

                        {data.variants.map((variant, index) => (
                            <div key={variant.id || index} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                                <div className="lg:col-span-3">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Label</label>
                                    <input
                                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        value={variant.label}
                                        onChange={(e) => updateVariant(index, "label", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="lg:col-span-3">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Variant SKU</label>
                                    <input
                                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        value={variant.sku}
                                        onChange={(e) => updateVariant(index, "sku", e.target.value)}
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        value={variant.price}
                                        onChange={(e) => updateVariant(index, "price", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                        value={variant.stock_level}
                                        onChange={(e) => updateVariant(index, "stock_level", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="lg:col-span-1 flex items-end">
                                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
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
                                        className="text-xs font-bold text-red-600 dark:text-red-400"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                                <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3 dark:border-orange-500/30 dark:bg-orange-500/10">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700 mb-2">Scheduled Discount / Flash Sale</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                                        <div className="lg:col-span-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Type</label>
                                            <select
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                value={variant.promo_type || ""}
                                                onChange={(e) => updateVariant(index, "promo_type", e.target.value)}
                                            >
                                                <option value="">None</option>
                                                <option value="discount">Discount</option>
                                                <option value="flash_sale">Flash Sale</option>
                                            </select>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Value Type</label>
                                            <select
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                value={variant.promo_value_type || "percent"}
                                                onChange={(e) => updateVariant(index, "promo_value_type", e.target.value)}
                                                disabled={!variant.promo_type}
                                            >
                                                <option value="percent">Percent %</option>
                                                <option value="fixed_amount">Fixed Amount</option>
                                                <option value="fixed_price">Final Price</option>
                                            </select>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Value</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                value={variant.promo_value || ""}
                                                onChange={(e) => updateVariant(index, "promo_value", e.target.value)}
                                                disabled={!variant.promo_type}
                                            />
                                        </div>

                                        <div className="lg:col-span-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Label</label>
                                            <input
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                value={variant.promo_label || ""}
                                                onChange={(e) => updateVariant(index, "promo_label", e.target.value)}
                                                placeholder="Flash Hour"
                                                disabled={!variant.promo_type}
                                            />
                                        </div>

                                        <div className="lg:col-span-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Start</label>
                                            <input
                                                type="datetime-local"
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                value={variant.promo_starts_at || ""}
                                                onChange={(e) => updateVariant(index, "promo_starts_at", e.target.value)}
                                                disabled={!variant.promo_type}
                                            />
                                        </div>

                                        <div className="lg:col-span-1">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">End</label>
                                            <input
                                                type="datetime-local"
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                                value={variant.promo_ends_at || ""}
                                                onChange={(e) => updateVariant(index, "promo_ends_at", e.target.value)}
                                                disabled={!variant.promo_type}
                                            />
                                        </div>
                                    </div>
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
