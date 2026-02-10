<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Keep local desktop/web clients working in development.
    // Tighten this list in production to known origins.
    'allowed_origins' => [
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:8001',
        'http://127.0.0.1:8001',
        'null',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
