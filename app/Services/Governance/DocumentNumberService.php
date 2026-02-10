<?php

namespace App\Services\Governance;

use App\Models\DocumentSequence;
use App\Models\Shop;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    public function next(string $documentType, int $shopId, ?\DateTimeInterface $date = null): string
    {
        $businessDate = $date
            ? CarbonImmutable::instance($date)->startOfDay()
            : CarbonImmutable::now()->startOfDay();
        $branchCode = $this->resolveBranchCode($shopId);

        return DB::transaction(function () use ($documentType, $branchCode, $businessDate): string {
            $sequence = DocumentSequence::query()
                ->where('document_type', $documentType)
                ->where('branch_code', $branchCode)
                ->whereDate('sequence_date', $businessDate->toDateString())
                ->lockForUpdate()
                ->first();

            if (! $sequence) {
                $sequence = DocumentSequence::query()->create([
                    'document_type' => $documentType,
                    'branch_code' => $branchCode,
                    'sequence_date' => $businessDate->toDateString(),
                    'last_number' => 0,
                ]);
            }

            $sequence->increment('last_number');
            $sequence->refresh();

            $seq = str_pad((string) $sequence->last_number, 5, '0', STR_PAD_LEFT);
            return sprintf('%s-%s-%s', $branchCode, $businessDate->format('Ymd'), $seq);
        });
    }

    private function resolveBranchCode(int $shopId): string
    {
        $shop = Shop::query()->findOrFail($shopId);
        if ($shop->code) {
            return strtoupper($shop->code);
        }

        $code = sprintf('B%03d', $shop->id);
        $shop->update(['code' => $code]);

        return $code;
    }
}
