import PrimaryButton from "@/Components/PrimaryButton";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});
    const submit = (e) => {
        e.preventDefault();
        post(route("verification.send"));
    };

    return (
        <div className="min-h-screen bg-orange-500 flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl">
                <div className="text-5xl mb-4">📧</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Email အားစစ်ဆေးပေးပါ
                </h2>
                <p className="text-gray-600 mb-6">
                    အကောင့်ဖွင့်ခြင်း အောင်မြင်ရန် သင်၏ Email ဆီသို့ ပို့ထားသော
                    Link အား နှိပ်ပေးပါရန် လိုအပ်ပါသည်။ Email မရောက်လာပါက
                    အောက်ကခလုတ်ကို နှိပ်ပြီး ထပ်မံပေးပို့နိုင်ပါသည်။
                </p>
                {status === "verification-link-sent" && (
                    <div className="mb-4 font-medium text-sm text-green-600">
                        Verification Link အသစ်တစ်ခု ထပ်မံပေးပို့ပြီးပါပြီ။
                    </div>
                )}
                <form onSubmit={submit}>
                    <button
                        disabled={processing}
                        className="w-full bg-orange-500 text-white font-bold py-3 rounded hover:bg-orange-600 transition"
                    >
                        Verification Email တစ်ခါပြန်ပို့မည်
                    </button>
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="mt-4 text-sm text-gray-500 underline"
                    >
                        Logout
                    </Link>
                </form>
            </div>
        </div>
    );
}
