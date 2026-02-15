import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthTopbar from '@/Components/AuthTopbar';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <div className="min-h-screen bg-orange-500 px-4 pb-10 pt-10 dark:bg-slate-950 md:px-10">
            <Head title="Forgot Password" />
            <AuthTopbar />

            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
                <div className="w-full overflow-hidden rounded-lg border border-orange-300/40 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid gap-0 md:grid-cols-2">
                        <div className="flex flex-col items-center justify-center bg-orange-600 p-12 text-center text-white">
                            <h1 className="mb-4 text-4xl font-bold italic tracking-tighter">LaraPee</h1>
                            <p className="text-orange-100 text-lg">
                                Password reset link ကို email မှ တစ်ဆင့်ပို့ပေးမယ်
                            </p>
                            <div className="mt-10 text-7xl">🔐</div>
                        </div>

                        <div className="p-8 md:p-12">
                            <h2 className="mb-5 text-2xl font-bold text-gray-800 dark:text-slate-100">
                                Forgot Password
                            </h2>
                            <div className="mb-4 text-sm text-gray-600 dark:text-slate-300">
                                Forgot your password? No problem. Enter your email and we will send a reset link.
                            </div>

                            {status && (
                                <div className="mb-4 text-sm font-medium text-green-600 dark:text-green-400">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit}>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full border-gray-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />

                                <InputError message={errors.email} className="mt-2" />

                                <div className="mt-4 flex items-center justify-end">
                                    <PrimaryButton className="ms-4" disabled={processing}>
                                        Email Password Reset Link
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
