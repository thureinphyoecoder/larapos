<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            if (!Schema::hasColumn('shops', 'code')) {
                $table->string('code', 16)->nullable()->unique()->after('name');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'invoice_no')) {
                $table->string('invoice_no', 40)->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('orders', 'receipt_no')) {
                $table->string('receipt_no', 40)->nullable()->unique()->after('invoice_no');
            }
            if (!Schema::hasColumn('orders', 'job_no')) {
                $table->string('job_no', 40)->nullable()->unique()->after('receipt_no');
            }
        });

        Schema::create('document_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('document_type', 20);
            $table->string('branch_code', 16);
            $table->date('sequence_date');
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();

            $table->unique(['document_type', 'branch_code', 'sequence_date'], 'document_sequences_unique');
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event', 80);
            $table->nullableMorphs('auditable');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('meta')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['event', 'created_at']);
        });

        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_type', 20);
            $table->string('status', 20)->default('pending');
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('reason', 255);
            $table->json('payload')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            $table->index(['request_type', 'status']);
        });

        Schema::create('financial_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('adjustment_type', 20);
            $table->decimal('amount', 12, 2);
            $table->string('reason', 255);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approval_request_id')->nullable()->constrained('approval_requests')->nullOnDelete();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'adjustment_type']);
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('event_type', 20);
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->foreignId('shop_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2)->nullable();
            $table->nullableMorphs('reference');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('note', 255)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['event_type', 'created_at']);
            $table->index(['product_variant_id', 'created_at']);
        });

        Schema::create('shift_closings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cashier_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('closed_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('shift_started_at');
            $table->timestamp('shift_ended_at');
            $table->unsignedInteger('orders_count')->default(0);
            $table->decimal('gross_amount', 12, 2)->default(0);
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['shop_id', 'shift_started_at']);
        });

        Schema::create('daily_branch_closings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained()->cascadeOnDelete();
            $table->date('business_date');
            $table->foreignId('closed_by')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('orders_count')->default(0);
            $table->decimal('gross_amount', 12, 2)->default(0);
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->json('summary')->nullable();
            $table->timestamps();

            $table->unique(['shop_id', 'business_date']);
        });

        Schema::create('backup_runs', function (Blueprint $table) {
            $table->id();
            $table->string('target', 20); // local / server
            $table->string('status', 20)->default('pending');
            $table->string('artifact_path', 255)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->string('checksum', 128)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['target', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_runs');
        Schema::dropIfExists('daily_branch_closings');
        Schema::dropIfExists('shift_closings');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('financial_adjustments');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('document_sequences');

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'job_no')) {
                $table->dropUnique(['job_no']);
                $table->dropColumn('job_no');
            }
            if (Schema::hasColumn('orders', 'receipt_no')) {
                $table->dropUnique(['receipt_no']);
                $table->dropColumn('receipt_no');
            }
            if (Schema::hasColumn('orders', 'invoice_no')) {
                $table->dropUnique(['invoice_no']);
                $table->dropColumn('invoice_no');
            }
        });

        Schema::table('shops', function (Blueprint $table) {
            if (Schema::hasColumn('shops', 'code')) {
                $table->dropUnique(['code']);
                $table->dropColumn('code');
            }
        });
    }
};
