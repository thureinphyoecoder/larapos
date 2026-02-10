<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!Auth::check() || !Auth::user()->hasAnyRole($roles)) {
            abort(403, 'ဒီစာမျက်နှာကို ဝင်ရောက်ဖို့ ခွင့်ပြုချက်မရှိပါဗျာ။');
        }

        return $next($request);
    }
}
