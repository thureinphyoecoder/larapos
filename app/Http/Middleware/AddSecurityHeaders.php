<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // Baseline hardening headers for XSS/clickjacking/MIME-sniffing protection.
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        // Keep geolocation for delivery/profile flows on same-origin only.
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
        // Keep local development compatible with Vite dev server/HMR.
        if (app()->isProduction()) {
            $response->headers->set(
                'Content-Security-Policy',
                "default-src 'self'; ".
                "base-uri 'self'; ".
                "frame-ancestors 'self'; ".
                "form-action 'self'; ".
                "img-src 'self' data: blob: https:; ".
                "font-src 'self' data: https://fonts.bunny.net; ".
                "style-src 'self' 'unsafe-inline' https://fonts.bunny.net; ".
                "script-src 'self' 'unsafe-inline'; ".
                "connect-src 'self' ws: wss:;"
            );

            if ($request->isSecure()) {
                $response->headers->set(
                    'Strict-Transport-Security',
                    'max-age=31536000; includeSubDomains'
                );
            }
        }

        return $response;
    }
}
