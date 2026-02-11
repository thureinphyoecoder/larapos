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
        return () => {
            reset("password", "password_confirmation");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        // Inertia post သည် CSRF protection ကို အလိုအလျောက် ကိုင်တွယ်ပေးသည်
        post(route("register"));
    };

    return (
        <div className="min-h-screen bg-orange-500 flex items-center justify-center p-4 md:p-10">
            <Head title={`${t("register", "Register")} - LaraPee`} />
            <div className="absolute right-4 top-4">
                <LocaleSwitcher />
            </div>

            <div className="max-w-4xl w-full bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row">
                {/* Branding Side */}
                <div className="hidden md:flex md:w-1/2 bg-orange-600 p-12 text-white flex-col justify-center items-center text-center">
                    <h1 className="text-5xl font-extrabold italic mb-4">
                        LaraPee
                    </h1>
                    <p className="text-orange-100 text-xl">
                        စတင်မှတ်ပုံတင်ပြီး အထူးစျေးနှုန်းများဖြင့် ဝယ်ယူလိုက်ပါ
                    </p>
                    <div className="mt-10 text-8xl animate-bounce">🛒</div>
                </div>

                {/* Form Side */}
                <div className="w-full md:w-1/2 p-8 lg:p-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8">
                        {t("register", "Register")}
                    </h2>

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <TextInput
                                id="name"
                                name="name"
                                value={data.name}
                                placeholder={t("register_name_placeholder", "Name")}
                                className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg shadow-sm"
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.name}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                placeholder={t("register_email_placeholder", "Email Address")}
                                className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg shadow-sm"
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                placeholder={t("login_password_placeholder", "Password")}
                                className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg shadow-sm"
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.password}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                placeholder={t("register_confirm_password_placeholder", "Confirm Password")}
                                className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg shadow-sm"
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-1"
                            />
                        </div>

                        <button
                            disabled={processing}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg transform transition active:scale-95 disabled:opacity-50"
                        >
                            {processing ? t("register_processing", "Registering...") : t("register_upper", "REGISTER")}
                        </button>

                        <div className="text-center mt-6">
                            <span className="text-gray-500 text-sm">
                                အကောင့်ရှိပြီးသားလား?{" "}
                            </span>
                            <Link
                                href={route("login")}
                                className="text-orange-600 font-bold hover:underline"
                            >
                                {t("login", "Log In")}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
