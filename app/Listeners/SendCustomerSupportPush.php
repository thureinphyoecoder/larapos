<?php

namespace App\Listeners;

use App\Events\SupportMessageSent;
use App\Services\MobilePushNotificationService;

class SendCustomerSupportPush
{
    public function __construct(
        private readonly MobilePushNotificationService $pushService,
    ) {
    }

    public function handle(SupportMessageSent $event): void
    {
        $message = $event->supportMessage;

        if (! $message->customer_id) {
            return;
        }

        // Do not notify when customer sends message to themselves.
        if ((int) $message->sender_id === (int) $message->customer_id) {
            return;
        }

        $sender = (string) ($message->sender?->name ?: 'Support');
        $text = trim((string) ($message->message ?: ''));

        $this->pushService->sendToUser(
            userId: (int) $message->customer_id,
            title: "{$sender} • Support",
            body: $text !== '' ? $text : 'Sent an attachment.',
            data: [
                'type' => 'support_message',
                'message_id' => $message->id,
                'customer_id' => $message->customer_id,
            ],
            app: 'customer-mobile',
        );
    }
}

