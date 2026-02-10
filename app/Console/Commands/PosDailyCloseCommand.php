<?php

namespace App\Console\Commands;

use App\Models\DailyBranchClosing;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class PosDailyCloseCommand extends Command
{
    protected $signature = 'pos:daily-close {--date=} {--shop_id=*} {--closed_by=}';

    protected $description = 'Generate per-branch daily close summary.';

    public function handle(): int
    {
        $date = $this->option('date') ? Carbon::parse((string) $this->option('date'))->toDateString() : now()->toDateString();
        $shopIds = collect((array) $this->option('shop_id'))->map(fn ($id) => (int) $id)->filter()->values();
        $closerId = (int) ($this->option('closed_by') ?: User::query()->role('admin')->value('id'));

        if ($closerId <= 0) {
            $this->error('No closing user found. Provide --closed_by user id.');
            return self::FAILURE;
        }

        $query = Shop::query();
        if ($shopIds->isNotEmpty()) {
            $query->whereIn('id', $shopIds->all());
        }

        $shops = $query->get(['id', 'name']);
        foreach ($shops as $shop) {
            $orders = Order::query()
                ->where('shop_id', $shop->id)
                ->whereDate('created_at', $date)
                ->get(['id', 'total_amount', 'status']);

            $ordersCount = $orders->count();
            $gross = (float) $orders->sum('total_amount');
            $refund = (float) $orders->whereIn('status', ['refund_requested', 'refunded', 'returned'])->sum('total_amount');
            $net = $gross - $refund;

            DailyBranchClosing::query()->updateOrCreate(
                ['shop_id' => $shop->id, 'business_date' => $date],
                [
                    'closed_by' => $closerId,
                    'orders_count' => $ordersCount,
                    'gross_amount' => $gross,
                    'refund_amount' => $refund,
                    'net_amount' => $net,
                    'summary' => [
                        'statuses' => $orders->groupBy('status')->map->count()->all(),
                    ],
                ]
            );

            $this->line("Closed {$shop->name} ({$date}) | orders={$ordersCount} gross={$gross} refund={$refund} net={$net}");
        }

        return self::SUCCESS;
    }
}
