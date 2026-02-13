import { useEffect } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import InputError from "@/Components/InputError";
import LocaleSwitcher from "@/Components/LocaleSwitcher";
import TextInput from "@/Components/TextInput";

export default function Register() {
    const { props } = usePage();
    const i18n = props?.i18n || {};
    const t = (key, fallback) => i18n?.[key] || fallback;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    useEffect(() => {
        return () => reset("password", "password_confirmation");
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("register"));
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-8 dark:bg-slate-950 md:px-8">
            <Head title={`${t("register", "Register")} - LaraPee`} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(251,146,60,0.24),transparent_36%),radial-gradient(circle_at_82%_18%,rgba(249,115,22,0.2),transparent_34%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.14),transparent_40%)]" />

            <div className="absolute right-4 top-4 z-20">
                <LocaleSwitcher />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-center pt-8">
                <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur md:grid-cols-2 dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="relative flex flex-col justify-between bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 p-8 text-white md:p-10">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-orange-100">LaraPee</p>
                            <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                                Create account
                            </h1>
                            <p className="mt-3 text-sm text-orange-50/95 md:text-base">
                                Start fast ordering, live support and secure tracking from your dashboard.
                            </p>
                        </div>
                        <div className="mt-8 rounded-2xl border border-white/30 bg-white/15 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-100">
                                Smart Commerce
                            </p>
                            <p className="mt-1 text-sm text-white/90">
                                Built for clean checkout and daily operations.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                            {t("register", "Register")}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Fill the form to open your account.
                        </p>

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <div>
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    placeholder={t("register_name_placeholder", "Name")}
                                    className="w-full rounded-xl border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-orange-500 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/30"
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
                                    placeholder={t("register_email_placeholder", "Email Address")}
                                    className="w-full rounded-xl border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-orange-500 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/30"
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
                                    placeholder={t("login_password_placeholder", "Password")}
                                    className="w-full rounded-xl border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-orange-500 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/30"
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
                                    placeholder={t("register_confirm_password_placeholder", "Confirm Password")}
                                    className="w-full rounded-xl border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-orange-500 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/30"
                                    onChange={(e) => setData("password_confirmation", e.target.value)}
                                    required
                                />
                                <InputError message={errors.password_confirmation} className="mt-1" />
                            </div>

                            <button
                                disabled={processing}
                                className="w-full rounded-xl bg-orange-600 py-3 font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? t("register_processing", "Registering...") : t("register_upper", "REGISTER")}
                            </button>

                            <div className="pt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                                အကောင့်ရှိပြီးသားလား?{" "}
                                <Link href={route("login")} className="font-bold text-orange-600 hover:underline">
                                    {t("login", "Log In")}
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
