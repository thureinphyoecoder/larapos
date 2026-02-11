<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Support\MarkSupportMessagesSeenAction;
use App\Actions\Support\StoreSupportMessageAction;
use App\Events\SupportMessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StoreSupportMessageRequest;
use App\Models\SupportMessage;
use App\Services\SupportChatQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SupportController extends Controller
{
    public function __construct(
        private readonly SupportChatQueryService $chatQueryService,
        private readonly StoreSupportMessageAction $storeSupportMessageAction,
        private readonly MarkSupportMessagesSeenAction $markSupportMessagesSeenAction,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $messagePaginator = $this->chatQueryService->customerMessages($user);
        $messages = collect($messagePaginator->items());

        if ($request->boolean('mark_seen', false)) {
            $this->markSupportMessagesSeenAction->execute($user->id, $messages);
        }
        $payload = $this->chatQueryService->messagePayload($messagePaginator);

        return response()->json([
            ...$payload,
            'assigned_staff' => $this->chatQueryService->assignedStaffForCustomer($user),
        ]);
    }

    public function store(StoreSupportMessageRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $message = $this->storeSupportMessageAction->execute(
            actor: $user,
            customerId: null,
            rawMessage: $request->input('message'),
            image: $request->file('image'),
        );

        event(new SupportMessageSent($message));

        return response()->json([
            'message' => 'Message sent.',
            'data' => [
                'id' => $message->id,
            ],
        ], 201);
    }

    public function update(Request $request, SupportMessage $message): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);
        abort_unless((int) $message->sender_id === (int) $user->id, 403);
        abort_unless((int) $message->customer_id === (int) $user->id, 403);

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $clean = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $validated['message'])) ?? '');
        if ($clean === '') {
            return response()->json([
                'message' => 'Message cannot be empty.',
            ], 422);
        }

        $message->update(['message' => $clean]);

        return response()->json([
            'message' => 'Message updated.',
            'data' => ['id' => $message->id],
        ]);
    }

    public function destroy(Request $request, SupportMessage $message): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);
        abort_unless((int) $message->sender_id === (int) $user->id, 403);
        abort_unless((int) $message->customer_id === (int) $user->id, 403);

        if ($message->attachment_path) {
            Storage::disk('public')->delete($message->attachment_path);
        }

        $deletedId = $message->id;
        $message->delete();

        return response()->json([
            'message' => 'Message deleted.',
            'data' => ['id' => $deletedId],
        ]);
    }
}
