<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        channels: __DIR__.'/../routes/channels.php',
        api: __DIR__.'/../routes/api.php',
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // 🎯 ဒီအပိုင်းက Props တွေ ရောက်ဖို့အတွက် အဓိကပါ
        $middleware->web(append: [
            \App\Http\Middleware\SetLocale::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\AddSecurityHeaders::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\AddSecurityHeaders::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return $response;
            }

            $status = $response->getStatusCode();

            if ($status === 419) {
                return redirect()
                    ->back()
                    ->with('error', 'Session expired. Please login again.');
            }

            if (in_array($status, [403, 404], true) || (!config('app.debug') && in_array($status, [500, 503], true))) {
                $message = match ($status) {
                    403 => 'You are not allowed to access that page.',
                    404 => 'The page you requested was not found.',
                    500 => 'Unexpected server error occurred.',
                    503 => 'Service is temporarily unavailable.',
                };

                return redirect()
                    ->route('home')
                    ->with('error', $message);
            }

            return $response;
        });
    })->create();
