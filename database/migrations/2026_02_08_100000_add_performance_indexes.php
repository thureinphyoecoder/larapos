<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $this->addIndexIfMissing('orders', ['shop_id', 'status']);
            $this->addIndexIfMissing('orders', ['shop_id', 'created_at']);
            $this->addIndexIfMissing('orders', ['user_id', 'created_at']);
            $this->addIndexIfMissing('orders', ['delivered_at']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $this->addIndexIfMissing('product_variants', ['product_id', 'is_active']);
            $this->addIndexIfMissing('product_variants', ['product_id', 'price']);
        });

        Schema::table('support_messages', function (Blueprint $table) {
            $this->addIndexIfMissing('support_messages', ['customer_id', 'id']);
            $this->addIndexIfMissing('support_messages', ['staff_id', 'id']);
            $this->addIndexIfMissing('support_messages', ['customer_id', 'seen_at']);
            $this->addIndexIfMissing('support_messages', ['sender_id', 'seen_at']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $this->addIndexIfMissing('cart_items', ['user_id', 'variant_id']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $this->addIndexIfMissing('order_items', ['order_id', 'product_variant_id']);
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $this->dropIndexIfExists('order_items', ['order_id', 'product_variant_id']);
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $this->dropIndexIfExists('cart_items', ['user_id', 'variant_id']);
        });

        Schema::table('support_messages', function (Blueprint $table) {
            $this->dropIndexIfExists('support_messages', ['customer_id', 'id']);
            $this->dropIndexIfExists('support_messages', ['staff_id', 'id']);
            $this->dropIndexIfExists('support_messages', ['customer_id', 'seen_at']);
            $this->dropIndexIfExists('support_messages', ['sender_id', 'seen_at']);
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $this->dropIndexIfExists('product_variants', ['product_id', 'is_active']);
            $this->dropIndexIfExists('product_variants', ['product_id', 'price']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $this->dropIndexIfExists('orders', ['shop_id', 'status']);
            $this->dropIndexIfExists('orders', ['shop_id', 'created_at']);
            $this->dropIndexIfExists('orders', ['user_id', 'created_at']);
            $this->dropIndexIfExists('orders', ['delivered_at']);
        });
    }

    private function addIndexIfMissing(string $table, array $columns): void
    {
        $indexName = $this->buildIndexName($table, $columns);

        if ($this->indexExists($table, $indexName)) {
            return;
        }

        $columnSql = implode(', ', array_map(fn ($column) => "`{$column}`", $columns));
        DB::statement("ALTER TABLE `{$table}` ADD INDEX `{$indexName}` ({$columnSql})");
    }

    private function dropIndexIfExists(string $table, array $columns): void
    {
        $indexName = $this->buildIndexName($table, $columns);

        if (!$this->indexExists($table, $indexName)) {
            return;
        }

        DB::statement("ALTER TABLE `{$table}` DROP INDEX `{$indexName}`");
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $result = DB::select(
            'SHOW INDEX FROM `' . $table . '` WHERE Key_name = ?',
            [$indexName]
        );

        return !empty($result);
    }

    private function buildIndexName(string $table, array $columns): string
    {
        return $table . '_' . implode('_', $columns) . '_index';
    }
};
