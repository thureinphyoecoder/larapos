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
use App\Models\ProductReview;
use App\Models\ShopStockShare;
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
        $createdShopIds = [];

        foreach ($vendors as $v) {
            $shop = Shop::firstOrCreate(['name' => $v['name']]);
            $createdShopIds[] = $shop->id;
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

            // ၇။ Delivery (ပစ္စည်းပို့ဝန်ထမ်း)
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
                $detailDescription = implode("\n", [
                    "Premium {$v['brand']} product designed for reliable daily use.",
                    "",
                    "Overview:",
                    "This model is selected for customers who want stable performance, clean design and long-lasting value.",
                    "Suitable for office, home, personal workflow and everyday lifestyle needs.",
                    "",
                    "Key Features:",
                    "- Durable build quality with modern finish",
                    "- Smooth performance for common tasks and multitasking",
                    "- User-friendly operation with practical controls",
                    "- Optimized for long daily usage sessions",
                    "- Reliable after-sales support from {$v['name']}",
                    "",
                    "Technical Notes:",
                    "- Product line: {$v['brand']} standard edition",
                    "- SKU base: {$v['brand']} enterprise seed sample",
                    "- Quality check: passed internal visual and packaging checklist",
                    "- Usage mode: suitable for beginners and regular users",
                    "",
                    "Shipping & Packaging:",
                    "- Secure boxed packaging with inner protection layers",
                    "- Standard delivery process with order tracking support",
                    "- Final product condition verified before dispatch",
                    "",
                    "Warranty & Support:",
                    "- Warranty availability may vary by seller policy",
                    "- Support contact available for setup and issue reporting",
                    "- Return/refund process follows platform order policy",
                    "",
                    "Box Includes:",
                    "- Main product unit",
                    "- Quick start guide",
                    "- Warranty / support information card",
                ]);
                $product = Product::create([
                    'shop_id' => $shop->id,
                    'brand_id' => $brand->id,
                    'category_id' => rand(1, 3),
                    'name' => $productName,
                    'slug' => Str::slug($productName) . '-' . Str::random(5),
                    'sku' => strtoupper(substr($v['brand'], 0, 3)) . "-00" . rand(100, 999),
                    'price' => 0,
                    'description' => $detailDescription,
                ]);

                $variantProfiles = [
                    ['label' => 'REG', 'price' => rand(50000, 500000), 'stock' => rand(5, 40)],
                    ['label' => 'PLUS', 'price' => rand(150000, 700000), 'stock' => rand(5, 30)],
                    ['label' => 'PRO', 'price' => rand(300000, 1000000), 'stock' => rand(3, 25)],
                    ['label' => 'MAX', 'price' => rand(300000, 1000000), 'stock' => rand(2, 20)],
                ];

                if (rand(0, 1) === 1) {
                    $variantProfiles[2]['price'] = $variantProfiles[1]['price'];
                }

                $variantCount = rand(3, 4);
                $selected = array_slice($variantProfiles, 0, $variantCount);
                foreach ($selected as $profile) {
                    $product->variants()->create([
                        'sku' => $product->sku . '-' . $profile['label'],
                        'price' => $profile['price'],
                        'stock_level' => $profile['stock'],
                        'is_active' => true,
                    ]);
                }

                $product->update([
                    'price' => min(array_column($selected, 'price')),
                    'stock_level' => array_sum(array_column($selected, 'stock')),
                ]);
            }
        }

        $createdShopIds = array_values(array_unique($createdShopIds));
        foreach ($createdShopIds as $fromShopId) {
            foreach ($createdShopIds as $toShopId) {
                if ($fromShopId === $toShopId) {
                    continue;
                }

                ShopStockShare::updateOrCreate(
                    ['from_shop_id' => $fromShopId, 'to_shop_id' => $toShopId],
                    ['is_enabled' => true, 'updated_by' => $admin->id]
                );
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

        // ၁၀။ Product Reviews (dummy comments + ratings)
        $reviewSamples = [
            ['reviewer_name' => 'Aye Aye', 'rating' => 5, 'comment' => 'Quality ကောင်းတယ်။ Packaging သပ်ရပ်ပါတယ်။'],
            ['reviewer_name' => 'Ko Htet', 'rating' => 4, 'comment' => 'Price နဲ့ယှဉ်ရင် တန်တယ်။ ထပ်ဝယ်မယ်။'],
            ['reviewer_name' => 'Su Su', 'rating' => 5, 'comment' => 'Delivery မြန်တယ်၊ service လည်း OK ပါတယ်။'],
            ['reviewer_name' => 'Zaw Min', 'rating' => 4, 'comment' => 'Variant ရွေးရတာလွယ်ပြီး checkout smooth ဖြစ်တယ်။'],
            ['reviewer_name' => 'Moe Pwint', 'rating' => 5, 'comment' => 'Color တကယ်လှတယ်။ ပစ္စည်းလည်းအဆင်ပြေပါတယ်။'],
            ['reviewer_name' => 'Nanda', 'rating' => 5, 'comment' => 'Stock info တိတိကျကျ ပြထားတာကြိုက်တယ်။'],
        ];

        $reviewProducts = Product::inRandomOrder()->take(4)->get();
        if ($reviewProducts->isNotEmpty()) {
            foreach ($reviewSamples as $idx => $sample) {
                $targetProduct = $reviewProducts[$idx % $reviewProducts->count()];
                ProductReview::firstOrCreate(
                    [
                        'product_id' => $targetProduct->id,
                        'reviewer_name' => $sample['reviewer_name'],
                        'comment' => $sample['comment'],
                    ],
                    [
                        'user_id' => null,
                        'rating' => $sample['rating'],
                    ],
                );
            }
        }
    }
}
