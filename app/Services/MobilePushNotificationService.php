<?php

namespace App\Services;

use App\Models\MobilePushToken;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MobilePushNotificationService
{
    /**
     * Expo push API endpoint.
     */
    private const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    public function registerToken(User $user, string $token, ?string $platform = null, ?string $app = null): void
    {
        MobilePushToken::query()->updateOrCreate(
            ['token' => $token],
            [
                'user_id' => $user->id,
                'platform' => $platform ?: null,
                'app' => $app ?: 'customer-mobile',
                'last_seen_at' => now(),
            ],
        );
    }

    public function unregisterToken(User $user, string $token): void
    {
        MobilePushToken::query()
            ->where('user_id', $user->id)
            ->where('token', $token)
            ->delete();
    }

    public function sendToUser(
        int $userId,
        string $title,
        string $body,
        array $data = [],
        string $app = 'customer-mobile',
    ): void {
        $tokens = MobilePushToken::query()
            ->where('user_id', $userId)
            ->where('app', $app)
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            return;
        }

        $this->sendTokens($tokens, $title, $body, $data);
    }

    /**
     * @param list<string> $tokens
     * @param array<string, mixed> $data
     */
    private function sendTokens(array $tokens, string $title, string $body, array $data = []): void
    {
        $accessToken = config('services.expo.access_token');

        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        if ($accessToken) {
            $headers['Authorization'] = 'Bearer '.$accessToken;
        }

        $messages = array_map(static function (string $to) use ($title, $body, $data): array {
            return [
                'to' => $to,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'sound' => 'default',
                'priority' => 'high',
            ];
        }, $tokens);

        try {
            $response = Http::withHeaders($headers)
                ->timeout(8)
                ->post(self::EXPO_PUSH_ENDPOINT, $messages);

            if (! $response->successful()) {
                Log::warning('Expo push send failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return;
            }

            $payload = $response->json();
            $results = is_array($payload['data'] ?? null) ? $payload['data'] : [];

            foreach ($results as $index => $result) {
                if (! is_array($result)) {
                    continue;
                }

                $errorCode = data_get($result, 'details.error');
                if ($errorCode === 'DeviceNotRegistered' && isset($tokens[$index])) {
                    MobilePushToken::query()->where('token', $tokens[$index])->delete();
                }
            }
        } catch (\Throwable $exception) {
            Log::warning('Expo push send exception', [
                'error' => $exception->getMessage(),
            ]);
        }
    }
}

