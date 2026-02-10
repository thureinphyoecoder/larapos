import { useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset("password");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"));
    };

    return (
        <div className="min-h-screen bg-orange-500 flex items-center justify-center p-6">
            <Head title="Log in" />

            <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">
                {/* ဘယ်ဘက်ခြမ်း: Branding Section */}
                <div className="md:w-1/2 bg-orange-600 p-12 text-white flex flex-col justify-center items-center text-center">
                    <h1 className="text-4xl font-bold mb-4 italic tracking-tighter">
                        LaraPee
                    </h1>
                    <p className="text-orange-100 text-lg">
                        မြန်မာနိုင်ငံ၏ အကောင်းဆုံး Online Marketplace
                    </p>
                    <div className="mt-10 text-8xl animate-bounce">🛒</div>
                </div>

                {/* ညာဘက်ခြမ်း: Login Form */}
                <div className="md:w-1/2 p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        Log In
                    </h2>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                            />
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-600">
                                <input
                                    type="checkbox"
                                    className="rounded text-orange-500"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                />
                                မှတ်ထားမည်
                            </label>
                            {canResetPassword && (
                                <Link
                                    href={route("password.request")}
                                    className="text-orange-600 hover:underline"
                                >
                                    Password မေ့နေသလား?
                                </Link>
                            )}
                        </div>

                        <button
                            disabled={processing}
                            className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition shadow-md disabled:opacity-50"
                        >
                            {processing ? "ခဏစောင့်ပါ..." : "LOG IN"}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-400">
                                    OR
                                </span>
                            </div>
                        </div>

                        <Link
                            href={route("register")}
                            className="w-full flex justify-center border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition"
                        >
                            အကောင့်အသစ်ဖွင့်မည်
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}
