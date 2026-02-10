<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PosBackfillCustomersPaymentsCommand extends Command
{
    protected $signature = 'pos:backfill-customers-payments {--dry-run}';

    protected $description = 'Backfill customers, order_items qty/unit_price, and seed payment ledger from legacy order records.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $this->line('Starting backfill: customers, order_items, payments ledger');

        $orders = Order::query()->with('user:id,name')->orderBy('id')->get(['id', 'user_id', 'customer_id', 'phone', 'address', 'total_amount', 'status', 'created_at']);

        $createdCustomers = 0;
        $linkedOrders = 0;
        $createdPayments = 0;

        DB::beginTransaction();
        try {
            foreach ($orders as $order) {
                if (! $order->customer_id && $order->phone) {
                    $customer = Customer::query()->firstOrCreate(
                        [
                            'phone' => $order->phone,
                            'name' => $order->user?->name ?: 'POS Customer',
                        ],
                        [
                            'address' => $order->address,
                            'created_by' => $order->user_id,
                        ],
                    );

                    if ($customer->wasRecentlyCreated) {
                        $createdCustomers++;
                    }

                    if (! $dryRun) {
                        $order->customer_id = $customer->id;
                        $order->save();
                    }
                    $linkedOrders++;
                }

                if (! Payment::query()->where('order_id', $order->id)->exists() && (float) $order->total_amount > 0) {
                    if (! $dryRun) {
                        Payment::query()->create([
                            'order_id' => $order->id,
                            'event_type' => 'deposit',
                            'amount' => (float) $order->total_amount,
                            'status' => in_array($order->status, ['refunded', 'returned', 'cancelled'], true) ? 'reconciled' : 'recorded',
                            'note' => 'Backfilled from legacy order total',
                            'actor_id' => $order->user_id,
                            'approved_at' => $order->created_at,
                        ]);
                    }
                    $createdPayments++;
                }
            }

            $affectedItems = 0;
            $items = DB::table('order_items')->select('id', 'qty', 'quantity', 'unit_price', 'price')->get();
            foreach ($items as $item) {
                $updates = [];
                if (is_null($item->qty) && ! is_null($item->quantity)) {
                    $updates['qty'] = (int) $item->quantity;
                }
                if (is_null($item->unit_price) && ! is_null($item->price)) {
                    $updates['unit_price'] = (float) $item->price;
                }

                if ($updates !== []) {
                    if (! $dryRun) {
                        DB::table('order_items')->where('id', $item->id)->update($updates);
                    }
                    $affectedItems++;
                }
            }

            if ($dryRun) {
                DB::rollBack();
                $this->warn('Dry run complete. No records changed.');
            } else {
                DB::commit();
            }

            $this->info("Customers created: {$createdCustomers}");
            $this->info("Orders linked to customer_id: {$linkedOrders}");
            $this->info("Payment ledger rows created: {$createdPayments}");
            $this->info("Order items updated (qty/unit_price): {$affectedItems}");

            return self::SUCCESS;
        } catch (\Throwable $exception) {
            DB::rollBack();
            $this->error('Backfill failed: ' . $exception->getMessage());
            return self::FAILURE;
        }
    }
}
