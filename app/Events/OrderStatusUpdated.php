<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    public function __construct(Order $order)
    {
        $this->order = $order->loadMissing(['user', 'shop']);
    }

    public function broadcastOn(): array
    {
        $channels = [
            new Channel('admin-notifications'),
            new Channel('order.' . $this->order->id),
        ];

        if ($this->order->user_id) {
            $channels[] = new PrivateChannel('user.' . $this->order->user_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'OrderStatusUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->order->id,
            'status' => $this->order->status,
            'delivery_lat' => $this->order->delivery_lat,
            'delivery_lng' => $this->order->delivery_lng,
            'delivery_updated_at' => $this->order->delivery_updated_at,
            'message' => "Order #{$this->order->id} status updated: {$this->order->status}",
        ];
    }
}
