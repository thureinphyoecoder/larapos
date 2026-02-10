<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'product_id' => $this->product_id,
            'product_variant_id' => $this->product_variant_id,
            'qty' => (int) ($this->qty ?? $this->quantity),
            'unit_price' => (float) ($this->unit_price ?? $this->price),
            'quantity' => (int) ($this->qty ?? $this->quantity),
            'price' => (float) ($this->unit_price ?? $this->price),
            'line_total' => (float) ($this->unit_price ?? $this->price) * (int) ($this->qty ?? $this->quantity),
            'product' => $this->whenLoaded('product', fn () => new ProductResource($this->product)),
            'variant' => $this->whenLoaded('variant', fn () => new ProductVariantResource($this->variant)),
        ];
    }
}
