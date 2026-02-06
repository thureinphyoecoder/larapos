import React from "react";
import { Head, useForm } from "@inertiajs/react";

export default function Edit({ order }) {
    const { data, setData, put, processing, errors } = useForm({
        phone: order.phone,
        address: order.address,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("orders.update", order.id));
    };

    return (
        <div className="py-12 max-w-2xl mx-auto px-4">
            <Head title="အော်ဒါပြင်ဆင်ရန်" />
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-xl font-bold mb-4">
                    အော်ဒါအချက်အလက် ပြင်ဆင်မည်
                </h2>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            ဖုန်းနံပါတ်
                        </label>
                        <input
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData("phone", e.target.value)}
                            className="w-full border rounded-lg p-2.5 mt-1"
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.phone}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            ပို့ဆောင်မည့် လိပ်စာ
                        </label>
                        <textarea
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                            className="w-full border rounded-lg p-2.5 mt-1 h-32"
                        />
                        {errors.address && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.address}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold"
                        >
                            {processing
                                ? "သိမ်းဆည်းနေပါသည်..."
                                : "အချက်အလက်အသစ် သိမ်းမည်"}
                        </button>
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="text-gray-500 px-6 py-2"
                        >
                            မပြင်တော့ပါ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
