<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\UpdateMeRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use App\Support\Payroll\PayrollCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class AuthController extends Controller
{
    public function __construct(
        private readonly PayrollCalculator $payrollCalculator,
    ) {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
            'shop_id' => $request->integer('shop_id') ?: null,
        ]);

        if (Role::query()->where('name', 'customer')->exists()) {
            $user->assignRole('customer');
        }

        $token = $user->createToken($request->input('device_name', 'pos-client'))->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->load('roles')),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email')->toString())->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Invalid credentials.',
            ]);
        }

        $token = $user->createToken($request->input('device_name', 'pos-client'))->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->load('roles')),
        ]);
    }

    public function me(): JsonResponse
    {
        $user = request()->user()?->load(['roles', 'profile', 'shop', 'payrollProfile']);

        return response()->json($this->buildMePayload($user));
    }

    public function updateMe(UpdateMeRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $validated = $request->validated();

        $user->forceFill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ])->save();

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'phone_number' => $validated['phone_number'] ?? null,
                'nrc_number' => $validated['nrc_number'] ?? null,
                'address_line_1' => $validated['address_line_1'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
            ],
        );

        $user->load(['roles', 'profile', 'shop', 'payrollProfile']);

        return response()->json([
            'message' => 'Profile updated successfully.',
            ...$this->buildMePayload($user),
        ]);
    }

    private function buildMePayload(?User $user): array
    {
        $month = now()->format('Y-m');
        $salaryPreview = null;

        if ($user && $user->hasAnyRole(['delivery', 'sales', 'manager', 'accountant', 'technician', 'cashier', 'admin'])) {
            $salaryPreview = $this->payrollCalculator
                ->calculate(collect([$user]), $month)
                ->first();
        }

        return [
            'user' => new UserResource($user),
            'profile' => [
                'shop_name' => $user?->shop?->name,
                'phone_number' => $user?->profile?->phone_number,
                'address' => $user?->profile?->address_line_1,
                'address_line_1' => $user?->profile?->address_line_1,
                'city' => $user?->profile?->city,
                'state' => $user?->profile?->state,
                'postal_code' => $user?->profile?->postal_code,
                'nrc_number' => $user?->profile?->nrc_number,
            ],
            'salary_preview' => $salaryPreview ? [
                'month' => $month,
                'net_salary' => (float) ($salaryPreview['totals']['net'] ?? 0),
                'gross_salary' => (float) ($salaryPreview['totals']['gross'] ?? 0),
                'deduction' => (float) ($salaryPreview['totals']['deduction'] ?? 0),
                'worked_days' => (int) ($salaryPreview['attendance']['days'] ?? 0),
                'expected_days' => (int) ($salaryPreview['attendance']['expected_days'] ?? 0),
            ] : null,
        ];
    }

    public function logout(): JsonResponse
    {
        request()->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
