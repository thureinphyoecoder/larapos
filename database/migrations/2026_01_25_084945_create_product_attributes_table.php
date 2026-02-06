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
        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // Products table မှာ brand_id ထပ်တိုးမယ်
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('shop_id')->constrained();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // အရင်ဆုံး foreign key ကို ဖျက်ရပါမယ်
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropColumn('brand_id');
        });

        // ပြီးမှ table ကို ဖျက်ပါ
        Schema::dropIfExists('brands');
    }
};
