<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'slip_verdict')) {
                $table->string('slip_verdict')->nullable()->after('payment_slip'); // ok/suspicious/manual
            }
            if (!Schema::hasColumn('orders', 'slip_score')) {
                $table->decimal('slip_score', 5, 2)->nullable()->after('slip_verdict');
            }
            if (!Schema::hasColumn('orders', 'slip_checked_at')) {
                $table->timestamp('slip_checked_at')->nullable()->after('slip_score');
            }
            if (!Schema::hasColumn('orders', 'slip_hash')) {
                $table->string('slip_hash', 64)->nullable()->after('slip_checked_at');
            }
            if (!Schema::hasColumn('orders', 'slip_notes')) {
                $table->text('slip_notes')->nullable()->after('slip_hash');
            }
            if (!Schema::hasColumn('orders', 'slip_meta')) {
                $table->json('slip_meta')->nullable()->after('slip_notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            foreach (['slip_meta', 'slip_notes', 'slip_hash', 'slip_checked_at', 'slip_score', 'slip_verdict'] as $col) {
                if (Schema::hasColumn('orders', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
