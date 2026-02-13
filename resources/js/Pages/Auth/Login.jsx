import { useEffect } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import LocaleSwitcher from "@/Components/LocaleSwitcher";

export default function Login({ canResetPassword }) {
    const { props } = usePage();
    const i18n = props?.i18n || {};
    const t = (key, fallback) => i18n?.[key] || fallback;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    useEffect(() => {
        return () => reset("password");
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"));
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-8 dark:bg-slate-950 md:px-8">
            <Head title={t("login", "Log in")} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(251,146,60,0.22),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.18),transparent_32%),radial-gradient(circle_at_50%_95%,rgba(249,115,22,0.14),transparent_40%)]" />

            <div className="absolute right-4 top-4 z-20">
                <LocaleSwitcher />
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-center pt-8">
                <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur md:grid-cols-2 dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="relative flex flex-col justify-between bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 p-8 text-white md:p-10">
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-orange-100">LaraPee</p>
                            <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                                Welcome back
                            </h1>
                            <p className="mt-3 text-sm text-orange-50/95 md:text-base">
                                Fast checkout, live support and order tracking in one clean workspace.
                            </p>
                        </div>
                        <div className="mt-8 rounded-2xl border border-white/30 bg-white/15 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-100">
                                Secure Sign In
                            </p>
                            <p className="mt-1 text-sm text-white/90">
                                Protected by session + CSRF validation.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                            {t("login", "Log In")}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {t("login", "Use your account credentials to continue.")}
                        </p>

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <div>
                                <input
                                    type="email"
                                    placeholder={t("login_email_placeholder", "Email Address")}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/30"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                />
                                {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
                            </div>

                            <div>
                                <input
                                    type="password"
                                    placeholder={t("login_password_placeholder", "Password")}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-400 dark:focus:ring-orange-500/30"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                />
                                {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-900"
                                        checked={data.remember}
                                        onChange={(e) => setData("remember", e.target.checked)}
                                    />
                                    မှတ်ထားမည်
                                </label>
                                {canResetPassword && (
                                    <Link href={route("password.request")} className="font-semibold text-orange-600 hover:underline">
                                        {t("forgot_password", "Forgot your password?")}
                                    </Link>
                                )}
                            </div>

                            <button
                                disabled={processing}
                                className="w-full rounded-xl bg-orange-600 py-3 font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? t("please_wait", "Please wait...") : t("login_upper", "LOG IN")}
                            </button>

                            <Link
                                href={route("register")}
                                className="flex w-full justify-center rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {t("open_new_account", "Create new account")}
                            </Link>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
