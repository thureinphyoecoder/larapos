import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Transition } from "@headlessui/react";
import { Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    profile,
    className = "",
}) {
    const { auth } = usePage().props;
    const [locating, setLocating] = useState(false);
    const [locationMessage, setLocationMessage] = useState("");
    const [locationError, setLocationError] = useState("");

    const user = auth?.user || {};
    const userProfile = profile || {};

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user?.name || "",
            email: user?.email || "",
            phone_number: userProfile?.phone_number || "",
            nrc_number: userProfile?.nrc_number || "",
            address_line_1: userProfile?.address_line_1 || "",
            city: userProfile?.city || "",
            state: userProfile?.state || "",
            postal_code: userProfile?.postal_code || "",
            photo: null,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route("profile.update"), { forceFormData: true });
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("ဒီ browser မှာ location feature မရပါ။");
            setLocationMessage("");
            return;
        }

        setLocating(true);
        setLocationError("");
        setLocationMessage("");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
                    );
                    const payload = await response.json();
                    const addr = payload?.address || {};
                    const display = payload?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

                    setData("address_line_1", display);
                    setData("city", addr.city || addr.town || addr.village || "");
                    setData("state", addr.state || addr.region || "");
                    if (addr.postcode) {
                        setData("postal_code", addr.postcode);
                    }

                    setLocationMessage("လက်ရှိတည်နေရာနဲ့ လိပ်စာဖြည့်ပြီးပါပြီ။");
                } catch {
                    setData("address_line_1", `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                    setLocationMessage("Coordinates ဖြင့် လိပ်စာဖြည့်ပြီးပါပြီ။");
                } finally {
                    setLocating(false);
                }
            },
            () => {
                setLocating(false);
                setLocationError("Location permission မရပါ (သို့) တည်နေရာ မရရှိပါ။");
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 },
        );
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="photo" value="Profile Photo" />
                    {userProfile?.photo_path ? (
                        <img
                            src={`/storage/${userProfile.photo_path}`}
                            alt="Profile"
                            className="mt-2 h-16 w-16 rounded-full object-cover border border-slate-200"
                        />
                    ) : null}
                    <input
                        id="photo"
                        type="file"
                        accept="image/*"
                        className="mt-2 block w-full text-sm text-slate-600"
                        onChange={(e) => setData("photo", e.target.files?.[0] || null)}
                    />
                    <InputError className="mt-2" message={errors.photo} />
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="phone_number" value="Phone" />

                    <TextInput
                        id="phone_number"
                        className="mt-1 block w-full"
                        value={data.phone_number}
                        onChange={(e) =>
                            setData("phone_number", e.target.value)
                        }
                        autoComplete="tel"
                    />

                    <InputError className="mt-2" message={errors.phone_number} />
                </div>

                <div>
                    <InputLabel htmlFor="nrc_number" value="NRC / National ID" />

                    <TextInput
                        id="nrc_number"
                        className="mt-1 block w-full"
                        value={data.nrc_number}
                        onChange={(e) => setData("nrc_number", e.target.value)}
                        required
                    />

                    <InputError className="mt-2" message={errors.nrc_number} />
                </div>

                <div>
                    <InputLabel htmlFor="address_line_1" value="Address" />

                    <TextInput
                        id="address_line_1"
                        className="mt-1 block w-full"
                        value={data.address_line_1}
                        onChange={(e) =>
                            setData("address_line_1", e.target.value)
                        }
                        required
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={locating}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${locating ? "bg-slate-400" : "bg-sky-600 hover:bg-sky-700"}`}
                        >
                            {locating ? "Locating..." : "Use Current Location"}
                        </button>
                        {locationMessage ? (
                            <span className="text-xs font-medium text-emerald-700">
                                {locationMessage}
                            </span>
                        ) : null}
                    </div>
                    {locationError ? (
                        <p className="mt-1 text-xs text-red-500">{locationError}</p>
                    ) : null}
                    <InputError className="mt-2" message={errors.address_line_1} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <InputLabel htmlFor="city" value="City" />
                        <TextInput
                            id="city"
                            className="mt-1 block w-full"
                            value={data.city}
                            onChange={(e) => setData("city", e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.city} />
                    </div>
                    <div>
                        <InputLabel htmlFor="state" value="State" />
                        <TextInput
                            id="state"
                            className="mt-1 block w-full"
                            value={data.state}
                            onChange={(e) => setData("state", e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.state} />
                    </div>
                    <div>
                        <InputLabel htmlFor="postal_code" value="Postal Code" />
                        <TextInput
                            id="postal_code"
                            className="mt-1 block w-full"
                            value={data.postal_code}
                            onChange={(e) =>
                                setData("postal_code", e.target.value)
                            }
                        />
                        <InputError
                            className="mt-2"
                            message={errors.postal_code}
                        />
                    </div>
                </div>

                {mustVerifyEmail && user?.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route("verification.send")}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === "verification-link-sent" && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
