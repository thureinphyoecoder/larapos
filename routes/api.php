<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ApprovalRequestController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\FinancialAdjustmentController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductReviewController;
use App\Http\Controllers\Api\V1\SupportController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::get('/health', fn () => response()->json([
        'status' => 'ok',
        'service' => config('app.name', 'larapee-smart'),
        'timestamp' => now()->toISOString(),
    ]))->name('health');

    Route::prefix('auth')->name('auth.')->middleware('throttle:30,1')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
        Route::post('/login', [AuthController::class, 'login'])->name('login');
    });

    Route::get('/catalog/products', [CatalogController::class, 'products'])->name('catalog.products');
    Route::get('/catalog/products/{product}', [CatalogController::class, 'product'])->name('catalog.product');
    Route::get('/catalog/meta', [CatalogController::class, 'meta'])->name('catalog.meta');

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::get('/me', [AuthController::class, 'me'])->name('me');
            Route::patch('/me', [AuthController::class, 'updateMe'])->name('me.update');
            Route::post('/me/photo', [AuthController::class, 'updateMePhoto'])->name('me.photo.update');
            Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        });

        Route::prefix('cart')->name('cart.')->group(function () {
            Route::get('/', [CartController::class, 'index'])->name('index');
            Route::post('/items', [CartController::class, 'store'])->name('store');
            Route::patch('/items/{cartItem}', [CartController::class, 'update'])->name('update');
            Route::delete('/items/{cartItem}', [CartController::class, 'destroy'])->name('destroy');
            Route::delete('/clear', [CartController::class, 'clear'])->name('clear');
        });

        Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
        Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
        Route::post('/orders/{order}/cancel', [OrderController::class, 'customerCancel'])->name('orders.cancel');
        Route::post('/orders/{order}/refund', [OrderController::class, 'requestRefund'])->name('orders.refund');
        Route::post('/orders/{order}/return', [OrderController::class, 'requestReturn'])->name('orders.return');
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');
        Route::patch('/orders/{order}/delivery-location', [OrderController::class, 'updateDeliveryLocation'])->name('orders.delivery-location');
        Route::post('/orders/{order}/shipment-proof', [OrderController::class, 'uploadShipmentProof'])->name('orders.shipment-proof');
        Route::post('/orders/{order}/approval-requests', [ApprovalRequestController::class, 'store'])->name('orders.approvals.store');
        Route::post('/orders/{order}/financial-adjustments', [FinancialAdjustmentController::class, 'store'])->name('orders.adjustments.store');
        Route::patch('/approval-requests/{approvalRequest}/approve', [ApprovalRequestController::class, 'approve'])->name('approvals.approve');
        Route::patch('/approval-requests/{approvalRequest}/reject', [ApprovalRequestController::class, 'reject'])->name('approvals.reject');

        Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::post('/catalog/products/{product}/reviews', [ProductReviewController::class, 'store'])->name('catalog.reviews.store');

        Route::prefix('support')->name('support.')->group(function () {
            Route::get('/messages', [SupportController::class, 'index'])->name('messages.index');
            Route::post('/messages', [SupportController::class, 'store'])->name('messages.store');
        });
    });
});
