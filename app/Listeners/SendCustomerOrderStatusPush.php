<?php

namespace App\Listeners;

use App\Events\OrderStatusUpdated;
use App\Services\MobilePushNotificationService;

class SendCustomerOrderStatusPush
{
    public function __construct(
        private readonly MobilePushNotificationService $pushService,
    ) {
    }

    public function handle(OrderStatusUpdated $event): void
    {
        $order = $event->order;

        if (! $order->user_id) {
            return;
        }

        $status = strtoupper((string) $order->status);
        $title = 'Order Update';
        $body = "Order #{$order->id} is now {$status}.";

        $this->pushService->sendToUser(
            userId: (int) $order->user_id,
            title: $title,
            body: $body,
            data: [
                'type' => 'order_status',
                'order_id' => $order->id,
                'status' => $order->status,
            ],
            app: 'customer-mobile',
        );
    }
}

