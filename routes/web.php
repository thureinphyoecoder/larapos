<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\SupportChatController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ShopController;
use App\Http\Controllers\Admin\CategoryController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', [ProductController::class, 'index'])->name('home');
Route::get('/product/{slug}', [ProductController::class, 'show'])->name('product.show');

Broadcast::routes(['middleware' => ['auth']]);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Dashboard for Everyone)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    // 🎯 ဒါက တစ်ခုတည်းသော Dashboard Route ပါ။ Controller ထဲမှာ Role ကို ခွဲပါမယ်။
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Cart
    Route::prefix('cart')->name('cart.')->group(function () {
        Route::get('/', [CartController::class, 'index'])->name('index');
        Route::post('/add', [CartController::class, 'store'])->name('add');
        Route::delete('/{id}', [CartController::class, 'destroy'])->name('destroy');
    });

    // Checkout & Orders
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::match(['get', 'post'], '/checkout/confirm', [OrderController::class, 'confirm'])->name('checkout.confirm');
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
    Route::post('/products/{product}/reviews', [ProductReviewController::class, 'store'])->name('products.reviews.store');
    Route::get('/orders', [OrderController::class, 'customerIndex'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'customerShow'])->name('orders.show');
    Route::get('/orders/{order}/receipt', [OrderController::class, 'customerReceipt'])->name('orders.receipt');
    Route::patch('/orders/{order}/cancel', [OrderController::class, 'customerCancel'])->name('orders.cancel');
    Route::post('/orders/{order}/refund', [OrderController::class, 'requestRefund'])->name('orders.refund');
    Route::post('/orders/{order}/return', [OrderController::class, 'requestReturn'])->name('orders.return');

    // Support Chat
    Route::get('/support', [SupportChatController::class, 'customer'])->name('support.index');
    Route::post('/support/messages', [SupportChatController::class, 'store'])->name('support.store');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*
|--------------------------------------------------------------------------
| Admin/Team Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'role:admin|manager|sales|delivery'])->prefix('admin')->name('admin.')->group(function () {

    // 🎯 Admin Dashboard ကို နာမည်ခွဲပေးလိုက်ပါ (Loop မပတ်အောင်)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/shops', [ShopController::class, 'index'])->name('shops.index');
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Products Management
    Route::resource('products', AdminProductController::class)->except(['destroy']);

    // Admin Orders
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('/support', [SupportChatController::class, 'adminIndex'])->name('support.index');
    Route::post('/support/messages', [SupportChatController::class, 'store'])->name('support.store');

    // Manager & Admin Only
    Route::middleware(['role:admin|manager'])->group(function () {
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.updateStatus');
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');
        Route::post('/orders/{order}/verify-slip', [OrderController::class, 'verifySlip'])->name('orders.verifySlip');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
    });

    // Delivery tracking updates (admin/manager/delivery)
    Route::middleware(['role:admin|manager|delivery'])->group(function () {
        Route::patch('/orders/{order}/location', [OrderController::class, 'updateLocation'])->name('orders.updateLocation');
        Route::post('/orders/{order}/ship-confirm', [OrderController::class, 'confirmShipment'])->name('orders.confirmShipment');
    });
});

require __DIR__ . '/auth.php';
