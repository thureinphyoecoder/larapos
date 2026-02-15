import PrimaryButton from "@/Components/PrimaryButton";
import AuthTopbar from "@/Components/AuthTopbar";
import { Head, Link, useForm } from "@inertiajs/react";

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});
    const submit = (e) => {
        e.preventDefault();
        post(route("verification.send"));
    };

    return (
        <div className="min-h-screen bg-orange-500 px-4 pb-10 pt-10 dark:bg-slate-950 md:px-10">
            <Head title="Verify Email" />
            <AuthTopbar />

            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
                <div className="w-full overflow-hidden rounded-lg border border-orange-300/40 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid gap-0 md:grid-cols-2">
                        <div className="flex flex-col items-center justify-center bg-orange-600 p-12 text-center text-white">
                            <h1 className="mb-4 text-4xl font-bold italic tracking-tighter">LaraPee</h1>
                            <p className="text-orange-100 text-lg">
                                Account activation အတွက် email verification လိုအပ်ပါတယ်
                            </p>
                            <div className="mt-10 text-7xl">📧</div>
                        </div>

                        <div className="p-8 text-center md:p-12">
                            <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-slate-100">
                                Email အားစစ်ဆေးပေးပါ
                            </h2>
                            <p className="mb-6 text-gray-600 dark:text-slate-300">
                                အကောင့်ဖွင့်ခြင်း အောင်မြင်ရန် သင်၏ Email ဆီသို့ ပို့ထားသော
                                Link အား နှိပ်ပေးပါရန် လိုအပ်ပါသည်။ Email မရောက်လာပါက
                                အောက်ကခလုတ်ကို နှိပ်ပြီး ထပ်မံပေးပို့နိုင်ပါသည်။
                            </p>
                            {status === "verification-link-sent" && (
                                <div className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">
                                    Verification Link အသစ်တစ်ခု ထပ်မံပေးပို့ပြီးပါပြီ။
                                </div>
                            )}
                            <form onSubmit={submit}>
                                <PrimaryButton disabled={processing} className="w-full justify-center py-3">
                                    Verification Email တစ်ခါပြန်ပို့မည်
                                </PrimaryButton>
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="mt-4 text-sm text-gray-500 underline dark:text-slate-400"
                                >
                                    Logout
                                </Link>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
