<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ဆိုင်ခွဲများ သို့မဟုတ် Vendor များ
        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // Products (Enterprise Level)
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained();
            $table->string('name');
            $table->string('sku')->unique();
            $table->decimal('price', 12, 2); // ဈေးနှုန်းကြီးရင်လည်း ဆံ့အောင် (12,2)
            $table->integer('stock_level')->default(0);
            $table->timestamps();
        });

        // Orders
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->string('phone')->nullable();    // ဖုန်းနံပါတ် ထည့်ဖို့
            $table->text('address')->nullable();     // လိပ်စာ ထည့်ဖို့
            $table->decimal('total_amount', 12, 2);
            $table->string('status')->default('pending'); // အော်ဒါအခြေအနေ
            $table->timestamp('delivered_at')->nullable(); // Delivered date for return window
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
        Schema::dropIfExists('products');
        Schema::dropIfExists('shops');
    }
};
