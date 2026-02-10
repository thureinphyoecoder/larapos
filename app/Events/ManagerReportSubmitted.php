<?php

namespace App\Events;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ManagerReportSubmitted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $manager,
        public ?Shop $shop,
        public string $businessDate,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('admin-notifications'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ManagerReportSubmitted';
    }

    public function broadcastWith(): array
    {
        $shopName = $this->shop?->name ?? 'Unknown Shop';

        return [
            'message' => "Manager report submitted: {$shopName} ({$this->businessDate})",
            'shop_id' => $this->shop?->id,
            'shop_name' => $shopName,
            'manager_id' => $this->manager->id,
            'manager_name' => $this->manager->name,
            'business_date' => $this->businessDate,
            'created_at' => now()->toISOString(),
        ];
    }
}
