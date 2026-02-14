<?php

$defaultLocalOrigins = [
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
];

$configuredOrigins = array_values(array_filter(array_map(
    static fn (string $origin): string => trim($origin),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
)));

$allowedOrigins = !empty($configuredOrigins)
    ? $configuredOrigins
    : (app()->environment('production') ? [] : $defaultLocalOrigins);

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // In production, set CORS_ALLOWED_ORIGINS to explicit trusted origins.
    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
