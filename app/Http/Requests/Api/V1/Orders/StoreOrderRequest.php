<?php

namespace App\Http\Requests\Api\V1\Orders;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['nullable', 'integer', 'exists:shops,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'min:7', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'payment_slip' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.variant_id' => ['required_with:items', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:999'],
        ];
    }
}
