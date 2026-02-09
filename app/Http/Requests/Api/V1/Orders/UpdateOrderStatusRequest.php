<?php

namespace App\Http\Requests\Api\V1\Orders;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'manager', 'accountant', 'cashier', 'technician', 'sales', 'delivery']) ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:pending,confirmed,shipped,delivered,cancelled,refund_requested,refunded,return_requested,returned'],
            'approval_request_id' => ['nullable', 'integer', 'exists:approval_requests,id'],
        ];
    }
}
