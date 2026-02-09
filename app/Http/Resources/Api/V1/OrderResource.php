<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
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
            'shop_id' => $this->shop_id,
            'total_amount' => (float) $this->total_amount,
            'status' => $this->status,
            'phone' => $this->phone,
            'address' => $this->address,
            'payment_slip_url' => $this->payment_slip ? Storage::disk('public')->url($this->payment_slip) : null,
            'delivered_at' => $this->delivered_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
            'shop' => $this->whenLoaded('shop', fn () => new ShopResource($this->shop)),
            'items' => $this->whenLoaded('items', fn () => OrderItemResource::collection($this->items)),
        ];
    }
}
