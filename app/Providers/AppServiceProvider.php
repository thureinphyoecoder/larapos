<?php

namespace App\Providers;

use App\Events\OrderStatusUpdated;
use App\Events\SupportMessageSent;
use App\Listeners\SendCustomerOrderStatusPush;
use App\Listeners\SendCustomerSupportPush;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Event::listen(OrderStatusUpdated::class, SendCustomerOrderStatusPush::class);
        Event::listen(SupportMessageSent::class, SendCustomerSupportPush::class);
    }
}
