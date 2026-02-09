<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_no' => $this->invoice_no,
            'receipt_no' => $this->receipt_no,
            'job_no' => $this->job_no,
            'user_id' => $this->user_id,
            'customer_id' => $this->customer_id,
            'shop_id' => $this->shop_id,
            'total_amount' => (float) $this->total_amount,
            'derived_total' => (float) $this->derivedTotal(),
            'paid_total' => (float) $this->paidTotal(),
            'balance_due' => (float) max(0, $this->derivedTotal() - $this->paidTotal()),
            'status' => $this->status,
            'phone' => $this->phone,
            'address' => $this->address,
            'payment_slip_url' => $this->payment_slip ? Storage::disk('public')->url($this->payment_slip) : null,
            'delivered_at' => $this->toIsoString($this->delivered_at),
            'created_at' => $this->toIsoString($this->created_at),
            'updated_at' => $this->toIsoString($this->updated_at),
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
            'customer' => $this->whenLoaded('customer', fn () => new CustomerResource($this->customer)),
            'shop' => $this->whenLoaded('shop', fn () => new ShopResource($this->shop)),
            'items' => $this->whenLoaded('items', fn () => OrderItemResource::collection($this->items)),
        ];
    }

    private function toIsoString(mixed $value): ?string
    {
        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        if (is_string($value) && trim($value) !== '') {
            try {
                return Carbon::parse($value)->toISOString();
            } catch (\Throwable) {
                return null;
            }
        }

        return null;
    }
}
