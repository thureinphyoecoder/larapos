<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'delivery_lat')) {
                $table->decimal('delivery_lat', 10, 7)->nullable()->after('status');
            }
            if (!Schema::hasColumn('orders', 'delivery_lng')) {
                $table->decimal('delivery_lng', 10, 7)->nullable()->after('delivery_lat');
            }
            if (!Schema::hasColumn('orders', 'delivery_updated_at')) {
                $table->timestamp('delivery_updated_at')->nullable()->after('delivery_lng');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'delivery_updated_at')) {
                $table->dropColumn('delivery_updated_at');
            }
            if (Schema::hasColumn('orders', 'delivery_lng')) {
                $table->dropColumn('delivery_lng');
            }
            if (Schema::hasColumn('orders', 'delivery_lat')) {
                $table->dropColumn('delivery_lat');
            }
        });
    }
};
