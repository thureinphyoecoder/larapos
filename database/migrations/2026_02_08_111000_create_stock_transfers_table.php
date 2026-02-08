<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('destination_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->foreignId('from_shop_id')->constrained('shops')->cascadeOnDelete();
            $table->foreignId('to_shop_id')->constrained('shops')->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['completed', 'blocked'])->default('completed');
            $table->string('note', 255)->nullable();
            $table->timestamps();

            $table->index(['from_shop_id', 'created_at']);
            $table->index(['to_shop_id', 'created_at']);
            $table->index(['source_variant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
