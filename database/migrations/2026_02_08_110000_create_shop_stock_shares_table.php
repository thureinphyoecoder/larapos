<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_stock_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('to_shop_id')->constrained('shops')->cascadeOnDelete();
            $table->boolean('is_enabled')->default(true);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['from_shop_id', 'to_shop_id']);
            $table->index(['from_shop_id', 'is_enabled']);
            $table->index(['to_shop_id', 'is_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_stock_shares');
    }
};
