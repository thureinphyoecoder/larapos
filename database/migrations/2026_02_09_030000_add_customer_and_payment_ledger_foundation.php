<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('phone', 30)->index();
                $table->text('address')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->unique(['phone', 'name']);
            });
        }

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->after('user_id')->constrained('customers')->nullOnDelete();
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'qty')) {
                $table->integer('qty')->nullable()->after('product_variant_id');
            }
            if (!Schema::hasColumn('order_items', 'unit_price')) {
                $table->decimal('unit_price', 15, 2)->nullable()->after('qty');
            }
        });

        if (!Schema::hasTable('order_discounts')) {
            Schema::create('order_discounts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained()->cascadeOnDelete();
                $table->string('type', 30)->default('manual');
                $table->decimal('amount', 15, 2);
                $table->string('reason', 255)->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('order_taxes')) {
            Schema::create('order_taxes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained()->cascadeOnDelete();
                $table->string('type', 30)->default('system');
                $table->decimal('amount', 15, 2);
                $table->decimal('rate', 8, 4)->nullable();
                $table->string('reason', 255)->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained()->cascadeOnDelete();
                $table->string('event_type', 30); // deposit/partial/verify/reject/refund/adjustment
                $table->decimal('amount', 15, 2)->default(0);
                $table->string('currency', 8)->default('MMK');
                $table->string('status', 30)->default('recorded');
                $table->string('reference_no', 120)->nullable();
                $table->text('note')->nullable();
                $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();

                $table->index(['order_id', 'event_type']);
                $table->index(['status', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_taxes');
        Schema::dropIfExists('order_discounts');

        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'unit_price')) {
                $table->dropColumn('unit_price');
            }
            if (Schema::hasColumn('order_items', 'qty')) {
                $table->dropColumn('qty');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'customer_id')) {
                $table->dropConstrainedForeignId('customer_id');
            }
        });

        Schema::dropIfExists('customers');
    }
};
