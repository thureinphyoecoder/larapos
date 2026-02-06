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
        // Attributes (ဥပမာ- Color, Size, Material)
        Schema::create('attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Color
            $table->timestamps();
        });

        // Attribute Values (ဥပမာ- Red, Blue, XL, L)
        Schema::create('attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained()->onDelete('cascade');
            $table->string('value'); // Red
            $table->timestamps();
        });

        // Product Variants (တကယ့် SKU ထွက်မယ့် Table)
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('sku')->unique(); // ရှူးဖိနပ် - အနီ - Size 40 အတွက် သီးသန့် SKU
            $table->decimal('price', 12, 2)->nullable(); // Variant အလိုက် ဈေးကွဲနိုင်ရင်
            $table->integer('stock_level')->default(0);
            $table->timestamps();
        });

        // Variant နဲ့ Value ချိတ်ဆက်မှု (Many-to-Many)
        Schema::create('variant_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->onDelete('cascade');
            $table->foreignId('attribute_value_id')->constrained()->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variant_attribute_values');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('attribute_values');
        Schema::dropIfExists('attributes');
    }
};
