import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthTopbar from '@/Components/AuthTopbar';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-orange-500 px-4 pb-10 pt-10 dark:bg-slate-950 md:px-10">
            <Head title="Reset Password" />
            <AuthTopbar />

            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
                <div className="w-full overflow-hidden rounded-lg border border-orange-300/40 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid gap-0 md:grid-cols-2">
                        <div className="flex flex-col items-center justify-center bg-orange-600 p-12 text-center text-white">
                            <h1 className="mb-4 text-4xl font-bold italic tracking-tighter">LaraPee</h1>
                            <p className="text-orange-100 text-lg">
                                Password အသစ်သတ်မှတ်ပြီး account ပြန်ဝင်ပါ
                            </p>
                            <div className="mt-10 text-7xl">♻️</div>
                        </div>

                        <div className="p-8 md:p-12">
                            <h2 className="mb-5 text-2xl font-bold text-gray-800 dark:text-slate-100">
                                Reset Password
                            </h2>

                            <form onSubmit={submit}>
                                <div>
                                    <InputLabel htmlFor="email" value="Email" />

                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full border-gray-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                                        autoComplete="username"
                                        onChange={(e) => setData('email', e.target.value)}
                                    />

                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div className="mt-4">
                                    <InputLabel htmlFor="password" value="Password" />

                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full border-gray-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                                        autoComplete="new-password"
                                        isFocused={true}
                                        onChange={(e) => setData('password', e.target.value)}
                                    />

                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <div className="mt-4">
                                    <InputLabel
                                        htmlFor="password_confirmation"
                                        value="Confirm Password"
                                    />

                                    <TextInput
                                        type="password"
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="mt-1 block w-full border-gray-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                                        autoComplete="new-password"
                                        onChange={(e) =>
                                            setData('password_confirmation', e.target.value)
                                        }
                                    />

                                    <InputError
                                        message={errors.password_confirmation}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="mt-4 flex items-center justify-end">
                                    <PrimaryButton className="ms-4" disabled={processing}>
                                        Reset Password
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
