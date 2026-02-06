<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\SlipVerifier;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class VerifyPaymentSlip implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $orderId)
    {
    }

    public function handle(SlipVerifier $verifier): void
    {
        $order = Order::find($this->orderId);
        if (!$order) {
            return;
        }

        $result = $verifier->verify($order);

        $order->slip_verdict = $result['verdict'] ?? 'manual';
        $order->slip_score = $result['score'] ?? 0;
        $order->slip_checked_at = now();
        $order->slip_hash = $result['hash'] ?? null;
        $order->slip_notes = isset($result['notes']) ? json_encode($result['notes']) : null;
        $order->slip_meta = $result;

        // Duplicate detection
        if ($order->slip_hash) {
            $dup = Order::where('id', '!=', $order->id)
                ->where('slip_hash', $order->slip_hash)
                ->exists();
            if ($dup) {
                $order->slip_verdict = 'suspicious';
                $order->slip_notes = json_encode(array_merge($result['notes'] ?? [], ['duplicate_hash']));
            }
        }

        $order->save();
    }
}
