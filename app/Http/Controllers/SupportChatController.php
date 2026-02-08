<?php

namespace App\Http\Controllers;

use App\Events\SupportMessageSent;
use App\Events\SupportMessageSeen;
use App\Models\SupportMessage;
use App\Models\User;
use App\Services\SupportAutoReplyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SupportChatController extends Controller
{
    public function __construct(private readonly SupportAutoReplyService $autoReplyService)
    {
    }

    public function customer(Request $request)
    {
        $user = $request->user();

        $messages = SupportMessage::with(['sender', 'staff'])
            ->where('customer_id', $user->id)
            ->orderBy('id')
            ->get();

        $this->markMessagesAsSeen($user->id, $messages);

        $assignedStaff = SupportMessage::with('staff')
            ->where('customer_id', $user->id)
            ->whereNotNull('staff_id')
            ->latest('id')
            ->first()?->staff;

        return Inertia::render('Support/Chat', [
            'messages' => $messages,
            'assignedStaff' => $assignedStaff ? [
                'id' => $assignedStaff->id,
                'name' => $assignedStaff->name,
            ] : null,
        ]);
    }

    public function adminIndex(Request $request)
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'manager', 'sales']), 403);

        $isAdmin = $user->hasRole('admin');

        $conversationQuery = SupportMessage::query()
            ->select('customer_id', DB::raw('MAX(id) as latest_id'))
            ->when(!$isAdmin, function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('staff_id', $user->id)->orWhereNull('staff_id');
                });
            })
            ->groupBy('customer_id');

        $latestIds = $conversationQuery->pluck('latest_id');

        $conversations = SupportMessage::with('customer')
            ->whereIn('id', $latestIds)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($msg) => [
                'customer_id' => $msg->customer_id,
                'customer_name' => $msg->customer?->name ?? 'Unknown',
                'last_message' => $msg->message,
                'last_time' => $msg->created_at?->diffForHumans(),
                'staff_id' => $msg->staff_id,
            ])
            ->values();

        $activeCustomerId = (int) ($request->integer('customer') ?: ($conversations->first()['customer_id'] ?? 0));

        $messages = collect();
        if ($activeCustomerId > 0) {
            $messages = SupportMessage::with('sender')
                ->where('customer_id', $activeCustomerId)
                ->when(!$isAdmin, function ($query) use ($user) {
                    $query->where(function ($q) use ($user) {
                        $q->where('staff_id', $user->id)->orWhereNull('staff_id');
                    });
                })
                ->orderBy('id')
                ->get();

            $this->markMessagesAsSeen($user->id, $messages);
        }

        return Inertia::render('Admin/SupportInbox', [
            'conversations' => $conversations,
            'messages' => $messages,
            'activeCustomerId' => $activeCustomerId,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string|min:1|max:1000',
            'customer_id' => 'nullable|integer|exists:users,id',
        ]);

        $user = $request->user();
        $cleanMessage = trim(preg_replace('/\s+/u', ' ', strip_tags($request->string('message')->toString())));

        if (mb_strlen($cleanMessage) < 1) {
            throw ValidationException::withMessages([
                'message' => 'Message cannot be empty.',
            ]);
        }

        if ($user->hasAnyRole(['admin', 'manager', 'sales'])) {
            $customerId = (int) $request->input('customer_id');
            if ($customerId <= 0) {
                throw ValidationException::withMessages([
                    'customer_id' => 'Customer is required.',
                ]);
            }

            SupportMessage::where('customer_id', $customerId)
                ->whereNull('staff_id')
                ->update(['staff_id' => $user->id]);

            $message = SupportMessage::create([
                'customer_id' => $customerId,
                'staff_id' => $user->id,
                'sender_id' => $user->id,
                'message' => $cleanMessage,
            ]);

            event(new SupportMessageSent($message));

            return back()->with('success', 'Reply sent.');
        }

        $staffId = $this->resolveStaffIdForCustomer($user);

        $message = SupportMessage::create([
            'customer_id' => $user->id,
            'staff_id' => $staffId,
            'sender_id' => $user->id,
            'message' => $cleanMessage,
        ]);

        event(new SupportMessageSent($message));

        $this->sendAutoReply($user, $staffId, $message->message);

        return back()->with('success', 'Message sent to support team.');
    }

    private function resolveStaffIdForCustomer(User $customer): ?int
    {
        $existingStaffId = SupportMessage::where('customer_id', $customer->id)
            ->whereNotNull('staff_id')
            ->latest('id')
            ->value('staff_id');

        if ($existingStaffId) {
            return (int) $existingStaffId;
        }

        $manager = User::role('manager')
            ->when($customer->shop_id, fn ($q) => $q->where('shop_id', $customer->shop_id))
            ->first();

        if ($manager) {
            return $manager->id;
        }

        $admin = User::role('admin')->first();
        if ($admin) {
            return $admin->id;
        }

        $sales = User::role('sales')->first();
        return $sales?->id;
    }

    private function sendAutoReply(User $customer, ?int $staffId, string $incomingMessage): void
    {
        $reply = $this->autoReplyService->buildReply($incomingMessage);

        if (!$reply) {
            return;
        }

        $bot = User::firstOrCreate(
            ['email' => 'support.bot@larapos.com'],
            [
                'name' => 'Support Bot',
                'password' => bcrypt(Str::random(40)),
            ],
        );

        if (!$bot->email_verified_at) {
            $bot->forceFill(['email_verified_at' => now()])->save();
        }

        $botMessage = SupportMessage::create([
            'customer_id' => $customer->id,
            'staff_id' => $staffId,
            'sender_id' => $bot->id,
            'message' => $reply,
        ]);

        event(new SupportMessageSent($botMessage));
    }

    private function markMessagesAsSeen(int $viewerId, $messages): void
    {
        $unseen = $messages->filter(function ($message) use ($viewerId) {
            return (int) $message->sender_id !== $viewerId && $message->seen_at === null;
        });

        if ($unseen->isEmpty()) {
            return;
        }

        SupportMessage::whereIn('id', $unseen->pluck('id'))->update(['seen_at' => now()]);

        foreach ($unseen as $msg) {
            event(new SupportMessageSeen(
                messageId: (int) $msg->id,
                viewerId: $viewerId,
                customerId: (int) $msg->customer_id,
                staffId: $msg->staff_id ? (int) $msg->staff_id : null,
            ));
        }
    }
}
