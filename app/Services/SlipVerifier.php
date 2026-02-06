<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class SlipVerifier
{
    public function verify(Order $order): array
    {
        if (!$order->payment_slip) {
            return [
                'verdict' => 'manual',
                'score' => 0,
                'hash' => null,
                'notes' => ['no_slip'],
                'text' => '',
                'ocr_available' => false,
            ];
        }

        $path = Storage::disk('public')->path($order->payment_slip);
        if (!is_file($path)) {
            return [
                'verdict' => 'manual',
                'score' => 0,
                'hash' => null,
                'notes' => ['file_missing'],
                'text' => '',
                'ocr_available' => false,
            ];
        }

        $python = config('services.slip_verify.python', 'python3');
        $script = base_path('scripts/slip_check.py');
        $process = new Process([$python, $script, '--image', $path, '--amount', (string) $order->total_amount]);
        $process->setTimeout(30);
        $process->run();

        if (!$process->isSuccessful()) {
            return [
                'verdict' => 'manual',
                'score' => 0,
                'hash' => null,
                'notes' => ['process_failed'],
                'text' => '',
                'ocr_available' => false,
            ];
        }

        $data = json_decode($process->getOutput(), true);
        if (!is_array($data)) {
            return [
                'verdict' => 'manual',
                'score' => 0,
                'hash' => null,
                'notes' => ['invalid_output'],
                'text' => '',
                'ocr_available' => false,
            ];
        }

        return $data;
    }
}
