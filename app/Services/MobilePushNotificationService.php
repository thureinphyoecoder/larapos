<?php

namespace App\Services;

use App\Models\MobilePushToken;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class MobilePushNotificationService
{
    /**
     * Expo push API endpoint.
     */
    private const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
    private static ?bool $hasTokenTable = null;

    public function registerToken(User $user, string $token, ?string $platform = null, ?string $app = null): void
    {
        if (! $this->canUseTokenTable()) {
            return;
        }

        try {
            MobilePushToken::query()->updateOrCreate(
                ['token' => $token],
                [
                    'user_id' => $user->id,
                    'platform' => $platform ?: null,
                    'app' => $app ?: 'customer-mobile',
                    'last_seen_at' => now(),
                ],
            );
        } catch (QueryException $exception) {
            if ($this->looksLikeMissingTable($exception)) {
                self::$hasTokenTable = false;
                return;
            }

            throw $exception;
        }
    }

    public function unregisterToken(User $user, string $token): void
    {
        if (! $this->canUseTokenTable()) {
            return;
        }

        try {
            MobilePushToken::query()
                ->where('user_id', $user->id)
                ->where('token', $token)
                ->delete();
        } catch (QueryException $exception) {
            if ($this->looksLikeMissingTable($exception)) {
                self::$hasTokenTable = false;
                return;
            }

            throw $exception;
        }
    }

    public function sendToUser(
        int $userId,
        string $title,
        string $body,
        array $data = [],
        string $app = 'customer-mobile',
    ): void {
        if (! $this->canUseTokenTable()) {
            return;
        }

        try {
            $tokens = MobilePushToken::query()
                ->where('user_id', $userId)
                ->where('app', $app)
                ->pluck('token')
                ->all();
        } catch (QueryException $exception) {
            if ($this->looksLikeMissingTable($exception)) {
                self::$hasTokenTable = false;
                Log::warning('mobile_push_tokens table missing while sending push', [
                    'error' => $exception->getMessage(),
                ]);
                return;
            }

            throw $exception;
        }

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
                'sound' => (string) config('services.expo.sound', 'larapee_alert.wav'),
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

    private function canUseTokenTable(): bool
    {
        if (self::$hasTokenTable !== null) {
            return self::$hasTokenTable;
        }

        try {
            self::$hasTokenTable = Schema::hasTable('mobile_push_tokens');
        } catch (\Throwable $exception) {
            Log::warning('Unable to check mobile_push_tokens table', [
                'error' => $exception->getMessage(),
            ]);
            self::$hasTokenTable = false;
        }

        return self::$hasTokenTable;
    }

    private function looksLikeMissingTable(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());
        return str_contains($message, 'doesn\'t exist')
            || str_contains($message, 'no such table')
            || str_contains($message, 'undefined table');
    }
}
