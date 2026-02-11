<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const ALLOWED_LOCALES = ['en', 'mm'];

    public function handle(Request $request, Closure $next): Response
    {
        $requestedLocale = strtolower((string) $request->query('lang', ''));
        if ($request->hasSession() && in_array($requestedLocale, self::ALLOWED_LOCALES, true)) {
            $request->session()->put('locale', $requestedLocale);
        }

        $sessionLocale = $request->hasSession()
            ? strtolower((string) $request->session()->get('locale', config('app.locale', 'en')))
            : strtolower((string) config('app.locale', 'en'));
        $locale = in_array($sessionLocale, self::ALLOWED_LOCALES, true) ? $sessionLocale : 'en';

        app()->setLocale($locale);

        return $next($request);
    }
}
