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
            if (!Schema::hasColumn('orders', 'delivery_proof_path')) {
                $table->string('delivery_proof_path')->nullable()->after('delivery_updated_at');
            }

            if (!Schema::hasColumn('orders', 'shipped_at')) {
                $table->timestamp('shipped_at')->nullable()->after('delivery_proof_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'shipped_at')) {
                $table->dropColumn('shipped_at');
            }

            if (Schema::hasColumn('orders', 'delivery_proof_path')) {
                $table->dropColumn('delivery_proof_path');
            }
        });
    }
};

