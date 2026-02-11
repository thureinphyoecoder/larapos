<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Support\MarkSupportMessagesSeenAction;
use App\Actions\Support\StoreSupportMessageAction;
use App\Events\SupportMessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StoreSupportMessageRequest;
use App\Services\SupportChatQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $this->markSupportMessagesSeenAction->execute($user->id, $messages);
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
}
