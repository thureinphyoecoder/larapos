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
        Schema::table('orders', function (Blueprint $table) {
            // payment_slip မရှိမှ ထည့်မယ်
            if (!Schema::hasColumn('orders', 'payment_slip')) {
                $table->string('payment_slip')->nullable()->after('total_amount');
            }

            // status မရှိမှ ထည့်မယ်
            if (!Schema::hasColumn('orders', 'status')) {
                $table->string('status')->default('pending')->after('payment_slip');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_slip', 'status']);
        });
    }
};
