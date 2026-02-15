import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthTopbar from '@/Components/AuthTopbar';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { props } = usePage();
    const i18n = props?.i18n || {};
    const t = (key, fallback) => i18n?.[key] || fallback;

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-orange-500 px-4 pb-10 pt-10 dark:bg-slate-950 md:px-10">
            <Head title={t('auth_confirm_page_title', 'Confirm Password')} />
            <AuthTopbar />

            <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
                <div className="w-full overflow-hidden rounded-lg border border-orange-300/40 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid gap-0 md:grid-cols-2">
                        <div className="flex flex-col items-center justify-center bg-orange-600 p-12 text-center text-white">
                            <h1 className="mb-4 text-4xl font-bold italic tracking-tighter">LaraPee</h1>
                            <p className="text-lg text-orange-100">{t('auth_confirm_tagline', 'Please confirm your password for secure access')}</p>
                            <div className="mt-10 text-7xl">🛡️</div>
                        </div>

                        <div className="p-8 md:p-12">
                            <h2 className="mb-5 text-2xl font-bold text-gray-800 dark:text-slate-100">{t('auth_confirm_heading', 'Confirm Password')}</h2>
                            <div className="mb-4 text-sm text-gray-600 dark:text-slate-300">
                                {t('auth_confirm_description', 'This is a secure area of the application. Please confirm your password before continuing.')}
                            </div>

                            <form onSubmit={submit}>
                                <div className="mt-4">
                                    <InputLabel htmlFor="password" value={t('password', 'Password')} />

                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full border-gray-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                                        isFocused={true}
                                        onChange={(e) => setData('password', e.target.value)}
                                    />

                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <div className="mt-4 flex items-center justify-end">
                                    <PrimaryButton className="ms-4" disabled={processing}>
                                        {t('auth_confirm_button', 'Confirm')}
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
