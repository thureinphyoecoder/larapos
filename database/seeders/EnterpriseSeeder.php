<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Shop;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EnterpriseSeeder extends Seeder
{
    public function run(): void
    {
        // ၁။ Roles သတ်မှတ်ခြင်း (Delivery role ပါ ထည့်လိုက်ပြီ)
        $roles = ['admin', 'manager', 'sales', 'delivery', 'customer'];
        foreach ($roles as $roleName) {
            Role::findOrCreate($roleName, 'web');
        }

        // ၂။ Super Admin (Verify ပါ တစ်ခါတည်း လုပ်ပေးထားတယ်)
        $admin = User::updateOrCreate(
            ['email' => 'admin@larapos.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(), // 🎯 ဒါကြောင့် verify ထပ်မတောင်းတော့ဘူး
            ]
        );
        $admin->assignRole('admin');

        // ၃။ Categories
        $categories = ['Electronics', 'Fashion', 'Home & Living'];
        foreach ($categories as $cat) {
            Category::updateOrCreate(['name' => $cat]);
        }

        // ၄။ Vendors & Shops
        $vendors = [
            ['name' => 'Apple Store', 'email' => 'apple@vendor.com', 'brand' => 'Apple'],
            ['name' => 'Samsung Global', 'email' => 'samsung@vendor.com', 'brand' => 'Samsung'],
        ];

        foreach ($vendors as $v) {
            $shop = Shop::firstOrCreate(['name' => $v['name']]);
            $brand = Brand::firstOrCreate(['name' => $v['brand']]);

            // ၅။ Manager (Verify ပါပြီးသား)
            $manager = User::updateOrCreate(
                ['email' => 'manager.' . Str::slug($v['name']) . '@larapos.com'],
                [
                    'name' => $v['name'] . ' Manager',
                    'password' => Hash::make('password'),
                    'shop_id' => $shop->id,
                    'email_verified_at' => now(),
                ]
            );
            $manager->assignRole('manager');

            // ၆။ Sales (အရောင်းဝန်ထမ်း)
            $sales = User::updateOrCreate(
                ['email' => 'sales.' . Str::slug($v['name']) . '@larapos.com'],
                [
                    'name' => $v['name'] . ' Sales',
                    'password' => Hash::make('password'),
                    'shop_id' => $shop->id,
                    'email_verified_at' => now(),
                ]
            );
            $sales->assignRole('sales');

            // ၇။ Delivery (ပစ္စည်းပို့ဝန်ထမ်း - အသစ်ထည့်လိုက်တာဗျ)
            $delivery = User::updateOrCreate(
                ['email' => 'delivery.' . Str::slug($v['name']) . '@larapos.com'],
                [
                    'name' => $v['name'] . ' Delivery',
                    'password' => Hash::make('password'),
                    'shop_id' => $shop->id,
                    'email_verified_at' => now(),
                ]
            );
            $delivery->assignRole('delivery');

        // ပစ္စည်းများ ထည့်သွင်းခြင်း logic...
        for ($i = 1; $i <= 3; $i++) {
            $productName = $v['brand'] . " Item $i";
            $product = Product::create([
                'shop_id' => $shop->id,
                'brand_id' => $brand->id,
                    'category_id' => rand(1, 3),
                    'name' => $productName,
                    'slug' => Str::slug($productName) . '-' . Str::random(5),
                    'sku' => strtoupper(substr($v['brand'], 0, 3)) . "-00" . rand(100, 999),
                    'price' => 0,
                ]);

                $product->variants()->create([
                    'sku' => $product->sku . "-REG",
                    'price' => rand(50000, 1000000),
                    'stock_level' => rand(5, 100),
                ]);
            }
        }

        // ၈။ Customer Users (seed for orders)
        $customer = User::updateOrCreate(
            ['email' => 'customer.' . Str::slug($v['name']) . '@larapos.com'],
            [
                'name' => $v['name'] . ' Customer',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $customer->assignRole('customer');

        // ၉။ Sample Orders + Items
        $variants = ProductVariant::with('product')->inRandomOrder()->take(3)->get();
        if ($variants->isNotEmpty()) {
            $order = Order::create([
                'user_id' => $customer->id,
                'shop_id' => $shop->id,
                'total_amount' => 0,
                'payment_slip' => 'slips/sample.jpg',
                'status' => 'pending',
                'phone' => '09123456789',
                'address' => 'Yangon, Sample Address',
            ]);

            $total = 0;
            foreach ($variants as $variant) {
                $qty = rand(1, 3);
                $price = $variant->price;
                $total += $price * $qty;

                $order->items()->create([
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $qty,
                    'price' => $price,
                ]);
            }

            $order->update(['total_amount' => $total]);
        }
    }
}
