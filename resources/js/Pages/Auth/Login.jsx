import { useEffect } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import AuthTopbar from "@/Components/AuthTopbar";

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
        return () => {
            reset("password");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"));
    };

    return (
        <div className="min-h-screen bg-orange-500 px-6 pb-6 pt-10 dark:bg-slate-950">
            <Head title={t("auth_login_page_title", "Log in")} />
            <AuthTopbar />

            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
                <div className="flex w-full flex-col overflow-hidden rounded-lg border border-orange-300/40 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 md:flex-row">
                    <div className="flex flex-col items-center justify-center bg-orange-600 p-12 text-center text-white md:w-1/2">
                        <h1 className="mb-4 text-4xl font-bold italic tracking-tighter">LaraPee</h1>
                        <p className="text-lg text-orange-100">{t("auth_marketplace_tagline", "Myanmar's best online marketplace")}</p>
                        <div className="mt-10 text-8xl animate-bounce">🛒</div>
                    </div>

                    <div className="p-8 md:w-1/2 md:p-12">
                        <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-slate-100">{t("login", "Log In")}</h2>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    placeholder={t("login_email_placeholder", "Email Address")}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-transparent focus:ring-2 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </div>

                            <div>
                                <input
                                    type="password"
                                    placeholder={t("login_password_placeholder", "Password")}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-transparent focus:ring-2 focus:ring-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                />
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        className="rounded text-orange-500"
                                        checked={data.remember}
                                        onChange={(e) => setData("remember", e.target.checked)}
                                    />
                                    {t("auth_remember_me", "Remember me")}
                                </label>
                                {canResetPassword && (
                                    <Link href={route("password.request")} className="text-orange-600 hover:underline dark:text-orange-400">
                                        {t("forgot_password", "Forgot your password?")}
                                    </Link>
                                )}
                            </div>

                            <button
                                disabled={processing}
                                className="w-full rounded-lg bg-orange-500 py-3 font-bold text-white shadow-md transition hover:bg-orange-600 disabled:opacity-50"
                            >
                                {processing ? t("please_wait", "Please wait...") : t("login_upper", "LOG IN")}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200 dark:border-slate-700"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-400 dark:bg-slate-900 dark:text-slate-500">OR</span>
                                </div>
                            </div>

                            <Link
                                href={route("register")}
                                className="flex w-full justify-center rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
