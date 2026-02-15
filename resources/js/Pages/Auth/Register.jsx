import { useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import AuthTopbar from "@/Components/AuthTopbar";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    useEffect(() => {
        return () => {
            reset("password", "password_confirmation");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("register"));
    };

    return (
        <div className="min-h-screen bg-orange-500 px-4 pb-10 pt-10 dark:bg-slate-950 md:px-10">
            <Head title="Register - LaraPee" />
            <AuthTopbar />

            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
                <div className="flex w-full flex-col overflow-hidden rounded-lg border border-orange-300/40 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:flex-row">
                    <div className="hidden flex-col items-center justify-center bg-orange-600 p-12 text-center text-white md:flex md:w-1/2">
                        <h1 className="mb-4 text-5xl font-extrabold italic">LaraPee</h1>
                        <p className="text-xl text-orange-100">စတင်မှတ်ပုံတင်ပြီး အထူးစျေးနှုန်းများဖြင့် ဝယ်ယူလိုက်ပါ</p>
                        <div className="mt-10 text-8xl animate-bounce">🛒</div>
                    </div>

                    <div className="w-full p-8 lg:p-12 md:w-1/2">
                        <h2 className="mb-8 text-3xl font-bold text-gray-800 dark:text-slate-100">Register</h2>

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    placeholder="အမည်"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    onChange={(e) => setData("name", e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    placeholder="Email လိပ်စာ"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    onChange={(e) => setData("email", e.target.value)}
                                    required
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            <div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    placeholder="Password"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    onChange={(e) => setData("password", e.target.value)}
                                    required
                                />
                                <InputError message={errors.password} className="mt-1" />
                            </div>

                            <div>
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    placeholder="Confirm Password"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    onChange={(e) => setData("password_confirmation", e.target.value)}
                                    required
                                />
                                <InputError message={errors.password_confirmation} className="mt-1" />
                            </div>

                            <button
                                disabled={processing}
                                className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white shadow-lg transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                            >
                                {processing ? "မှတ်ပုံတင်နေပါသည်..." : "REGISTER"}
                            </button>

                            <div className="mt-6 text-center">
                                <span className="text-sm text-gray-500 dark:text-slate-400">အကောင့်ရှိပြီးသားလား? </span>
                                <Link href={route("login")} className="font-bold text-orange-600 hover:underline dark:text-orange-400">
                                    Log In
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
