import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

export default function SupportInbox({
    conversations = [],
    messages = [],
    messagePagination = { current_page: 1, last_page: 1 },
    activeCustomerId = 0,
}) {
    const { auth } = usePage().props;
    const userId = auth?.user?.id;
    const listRef = useRef(null);
    const lastMessageIdRef = useRef(null);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingMessage, setEditingMessage] = useState("");
    const { data, setData, post, processing, reset } = useForm({
        message: "",
        customer_id: activeCustomerId || "",
        image: null,
    });

    const scrollToBottom = (behavior = "smooth") => {
        if (!listRef.current) return;
        listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior,
        });
        setShowJumpToLatest(false);
    };

    const goToMessagePage = (page) => {
        router.get(
            route("admin.support.index", {
                customer: activeCustomerId,
                message_page: page,
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ["messages", "messagePagination", "activeCustomerId", "conversations"],
            },
        );
    };

    useEffect(() => {
        setData("customer_id", activeCustomerId || "");
    }, [activeCustomerId]);

    useEffect(() => {
        if (!window.Echo || !userId) return;

        const privateChannel = `user.${userId}`;
        window.Echo.private(privateChannel).listen(".SupportMessageSent", () => {
            router.reload({ only: ["conversations", "messages", "messagePagination", "activeCustomerId"] });
        });
        window.Echo.private(privateChannel).listen(".SupportMessageSeen", () => {
            router.reload({ only: ["messages", "messagePagination"] });
        });

        window.Echo.channel("admin-notifications").listen(".SupportMessageSent", () => {
            router.reload({ only: ["conversations", "messages", "messagePagination", "activeCustomerId"] });
        });

        return () => {
            window.Echo.leaveChannel(privateChannel);
            window.Echo.leaveChannel("admin-notifications");
        };
    }, [userId, activeCustomerId]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("support:clear-notifications"));
    }, [activeCustomerId]);

    useEffect(() => {
        lastMessageIdRef.current = null;
        setShowJumpToLatest(false);
    }, [activeCustomerId]);

    useEffect(() => {
        const currentLastId = messages.length ? messages[messages.length - 1].id : null;
        const previousLastId = lastMessageIdRef.current;
        const hasNewMessage = previousLastId !== null && currentLastId !== previousLastId;

        if (!listRef.current) {
            lastMessageIdRef.current = currentLastId;
            return;
        }

        const listEl = listRef.current;
        const distanceFromBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight;
        const isNearBottom = distanceFromBottom <= 96;

        if (previousLastId === null || isNearBottom || !hasNewMessage) {
            requestAnimationFrame(() => scrollToBottom("auto"));
        } else {
            setShowJumpToLatest(true);
        }

        lastMessageIdRef.current = currentLastId;
    }, [messages, activeCustomerId]);

    const handleListScroll = () => {
        if (!listRef.current) return;
        const listEl = listRef.current;
        const distanceFromBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight;
        setShowJumpToLatest(distanceFromBottom > 96);
    };

    const hasContent = data.message.trim().length > 0 || data.image !== null;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.support.store"), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset("message", "image");
                if (Number(messagePagination?.current_page || 1) !== 1) {
                    goToMessagePage(1);
                }
            },
        });
    };

    const beginEdit = (message) => {
        setEditingMessageId(message.id);
        setEditingMessage(message.message || "");
    };

    const cancelEdit = () => {
        setEditingMessageId(null);
        setEditingMessage("");
    };

    const submitEdit = (messageId) => {
        const trimmed = editingMessage.trim();
        if (!trimmed) return;

        router.patch(
            route("admin.support.update", messageId),
            { message: trimmed },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => cancelEdit(),
            },
        );
    };

    const removeMessage = (messageId) => {
        const ok = window.confirm("ဒီ message ကိုဖျက်မှာ သေချာပါသလား?");
        if (!ok) return;

        router.delete(route("admin.support.destroy", messageId), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AdminLayout header="Support Inbox">
            <Head title="Support Inbox" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Customers</h3>
                    </div>
                    <div className="max-h-[620px] overflow-y-auto">
                        {conversations.length ? (
                            conversations.map((c) => (
                                <Link
                                    key={c.customer_id}
                                    href={route("admin.support.index", {
                                        customer: c.customer_id,
                                        message_page: 1,
                                    })}
                                    className={`block px-4 py-3 border-b border-slate-50 ${
                                        Number(activeCustomerId) === Number(c.customer_id)
                                            ? "bg-orange-50"
                                            : "hover:bg-slate-50"
                                    }`}
                                >
                                    <p className="font-semibold text-slate-700 text-sm">{c.customer_name}</p>
                                    <p className="text-xs text-slate-500 mt-1 truncate">{c.last_message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{c.last_time}</p>
                                </Link>
                            ))
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-400">No support conversations yet.</div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 h-[720px] flex flex-col relative">
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">
                            {activeCustomerId ? `Conversation #${activeCustomerId}` : "Select customer"}
                        </h3>
                        <div className="text-xs text-slate-500 flex gap-2">
                            <button
                                type="button"
                                onClick={() => goToMessagePage(Number(messagePagination.current_page) + 1)}
                                disabled={
                                    !activeCustomerId ||
                                    Number(messagePagination.current_page) >= Number(messagePagination.last_page)
                                }
                                className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40"
                            >
                                Older
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    goToMessagePage(Math.max(1, Number(messagePagination.current_page) - 1))
                                }
                                disabled={!activeCustomerId || Number(messagePagination.current_page) <= 1}
                                className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40"
                            >
                                Newer
                            </button>
                        </div>
                    </div>

                    <div ref={listRef} onScroll={handleListScroll} className="flex-1 overflow-y-auto space-y-3 p-2 mt-2">
                        {messages.length ? (
                            messages.map((m) => {
                                const mine = Number(m.sender_id) === Number(userId);
                                return (
                                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                                                mine ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"
                                            }`}
                                        >
                                            <p className={`text-[11px] mb-1 font-semibold ${mine ? "text-white/80" : "text-slate-500"}`}>
                                                {mine ? "You" : m.sender?.name || "Customer"}
                                            </p>
                                            {editingMessageId === m.id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={editingMessage}
                                                        onChange={(e) => setEditingMessage(e.target.value)}
                                                        rows={3}
                                                        className={`w-full rounded-lg border px-2 py-1 text-sm ${
                                                            mine
                                                                ? "border-white/40 bg-white/10 text-white placeholder:text-white/70"
                                                                : "border-slate-300 bg-white text-slate-700"
                                                        }`}
                                                    />
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={cancelEdit}
                                                            className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                                                mine ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                                                            }`}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => submitEdit(m.id)}
                                                            className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                                                mine ? "bg-white text-sky-700" : "bg-sky-600 text-white"
                                                            }`}
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                m.message ? <p>{m.message}</p> : null
                                            )}
                                            {m.attachment_url ? (
                                                <a
                                                    href={m.attachment_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 block"
                                                >
                                                    <img
                                                        src={m.attachment_url}
                                                        alt={m.attachment_name || "attachment"}
                                                        className="max-h-56 rounded-lg border border-black/10"
                                                    />
                                                </a>
                                            ) : null}
                                            <p className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-slate-400"}`}>
                                                {m.sender?.name || "User"} - {new Date(m.created_at).toLocaleString()}
                                                {mine ? ` • ${m.seen_at ? "Seen" : "Sent"}` : ""}
                                            </p>
                                            {mine && editingMessageId !== m.id ? (
                                                <div className="mt-2 flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => beginEdit(m)}
                                                        className={`text-[11px] font-semibold ${mine ? "text-white/90" : "text-slate-500"}`}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMessage(m.id)}
                                                        className={`text-[11px] font-semibold ${mine ? "text-rose-100" : "text-rose-600"}`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No messages.</div>
                        )}
                    </div>

                    {showJumpToLatest && (
                        <button
                            type="button"
                            onClick={() => scrollToBottom("smooth")}
                            className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-lg"
                        >
                            New messages ↓
                        </button>
                    )}

                    <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-100" encType="multipart/form-data">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={data.message}
                                onChange={(e) => setData("message", e.target.value)}
                                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                                placeholder="Reply to customer..."
                                disabled={!activeCustomerId}
                            />
                            <label
                                className={`px-3 py-3 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer ${
                                    !activeCustomerId ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50"
                                }`}
                            >
                                Image
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    disabled={!activeCustomerId}
                                    onChange={(e) => setData("image", e.target.files?.[0] || null)}
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={processing || !hasContent || !activeCustomerId}
                                className={`px-5 rounded-xl text-sm font-bold ${
                                    processing || !hasContent || !activeCustomerId
                                        ? "bg-slate-300 text-slate-500"
                                        : "bg-sky-600 text-white hover:bg-sky-700"
                                }`}
                            >
                                Send
                            </button>
                        </div>
                        {data.image ? (
                            <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                                <span className="truncate">{data.image.name}</span>
                                <button type="button" className="text-rose-600" onClick={() => setData("image", null)}>
                                    Remove
                                </button>
                            </div>
                        ) : null}
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
