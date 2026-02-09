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
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnterpriseSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ၁။ Roles သတ်မှတ်ခြင်း (Delivery role ပါ ထည့်လိုက်ပြီ)
        $roles = ['admin', 'manager', 'sales', 'delivery', 'customer', 'cashier', 'accountant', 'technician'];
        $existingRoles = Role::query()
            ->where('guard_name', 'web')
            ->whereIn('name', $roles)
            ->pluck('name')
            ->all();
        foreach (array_diff($roles, $existingRoles) as $roleName) {
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
        $existingCategories = Category::query()
            ->whereIn('name', $categories)
            ->pluck('name')
            ->all();
        foreach (array_diff($categories, $existingCategories) as $cat) {
            Category::create(['name' => $cat]);
        }
        $categoryIds = Category::query()->whereIn('name', $categories)->pluck('id')->all();

        // ၄။ Vendors & Shops
        $vendors = [
            ['name' => 'Apple Store', 'email' => 'apple@vendor.com', 'brand' => 'Apple'],
            ['name' => 'Samsung Global', 'email' => 'samsung@vendor.com', 'brand' => 'Samsung'],
        ];
        $vendorNames = array_column($vendors, 'name');
        $brandNames = array_column($vendors, 'brand');

        $shopsByName = Shop::query()->whereIn('name', $vendorNames)->get()->keyBy('name');
        foreach (array_diff($vendorNames, $shopsByName->keys()->all()) as $shopName) {
            $shopsByName->put($shopName, Shop::create(['name' => $shopName]));
        }

        $brandsByName = Brand::query()->whereIn('name', $brandNames)->get()->keyBy('name');
        foreach (array_diff($brandNames, $brandsByName->keys()->all()) as $brandName) {
            $brandsByName->put($brandName, Brand::create(['name' => $brandName]));
        }

        $createdShopIds = [];

        foreach ($vendors as $v) {
            $shop = $shopsByName[$v['name']];
            $createdShopIds[] = $shop->id;
            $brand = $brandsByName[$v['brand']];

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
            $sales->syncRoles(['sales', 'cashier']);

            $accountant = User::updateOrCreate(
                ['email' => 'accountant.' . Str::slug($v['name']) . '@larapos.com'],
                [
                    'name' => $v['name'] . ' Accountant',
                    'password' => Hash::make('password'),
                    'shop_id' => $shop->id,
                    'email_verified_at' => now(),
                ]
            );
            $accountant->syncRoles(['accountant']);

            $technician = User::updateOrCreate(
                ['email' => 'technician.' . Str::slug($v['name']) . '@larapos.com'],
                [
                    'name' => $v['name'] . ' Technician',
                    'password' => Hash::make('password'),
                    'shop_id' => $shop->id,
                    'email_verified_at' => now(),
                ]
            );
            $technician->syncRoles(['technician']);

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
            $vendorProductIds = [];
            $variantRows = [];
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
                    'category_id' => $categoryIds[array_rand($categoryIds)],
                    'name' => $productName,
                    'slug' => Str::slug($productName) . '-' . Str::random(5),
                    'sku' => strtoupper(substr($v['brand'], 0, 3)) . "-00" . rand(100, 999),
                    'price' => 0,
                    'description' => $detailDescription,
                ]);
                $vendorProductIds[] = $product->id;

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
                    $variantRows[] = [
                        'product_id' => $product->id,
                        'sku' => $product->sku . '-' . $profile['label'],
                        'price' => $profile['price'],
                        'stock_level' => $profile['stock'],
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            ProductVariant::insert($variantRows);

            Product::query()
                ->whereIn('id', $vendorProductIds)
                ->update([
                    'price' => DB::raw('(select min(product_variants.price) from product_variants where product_variants.product_id = products.id)'),
                    'stock_level' => DB::raw('(select coalesce(sum(product_variants.stock_level), 0) from product_variants where product_variants.product_id = products.id)'),
                    'updated_at' => $now,
                ]);
        }

        $createdShopIds = array_values(array_unique($createdShopIds));
        if ($createdShopIds !== []) {
            DB::table('shop_stock_shares')
                ->whereIn('from_shop_id', $createdShopIds)
                ->whereIn('to_shop_id', $createdShopIds)
                ->whereColumn('from_shop_id', '!=', 'to_shop_id')
                ->update([
                    'is_enabled' => true,
                    'updated_by' => $admin->id,
                    'updated_at' => $now,
                ]);

            $newSharePairs = DB::table('shops as source')
                ->join('shops as target', fn ($join) => $join->whereColumn('source.id', '!=', 'target.id'))
                ->leftJoin('shop_stock_shares as shares', function ($join) {
                    $join->on('shares.from_shop_id', '=', 'source.id')
                        ->on('shares.to_shop_id', '=', 'target.id');
                })
                ->whereIn('source.id', $createdShopIds)
                ->whereIn('target.id', $createdShopIds)
                ->whereNull('shares.id')
                ->selectRaw('source.id as from_shop_id, target.id as to_shop_id, ? as is_enabled, ? as updated_by, ? as created_at, ? as updated_at', [
                    true,
                    $admin->id,
                    $now,
                    $now,
                ]);

            DB::table('shop_stock_shares')->insertUsing(
                ['from_shop_id', 'to_shop_id', 'is_enabled', 'updated_by', 'created_at', 'updated_at'],
                $newSharePairs
            );
        }

        // ၈။ Customer Users (seed for orders)
        $customer = User::updateOrCreate(
            ['email' => 'customer@larapos.com'],
            [
                'name' => 'Sample Customer',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $customer->assignRole('customer');

        // ၉။ Sample Orders + Items
        $orderShopId = $createdShopIds[array_rand($createdShopIds)] ?? null;
        $variants = ProductVariant::query()
            ->select('product_variants.id', 'product_variants.product_id', 'product_variants.price')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->where('products.shop_id', $orderShopId)
            ->inRandomOrder()
            ->limit(3)
            ->get();
        if ($orderShopId && $variants->isNotEmpty()) {
            $itemRows = [];
            $orderTotal = 0;
            foreach ($variants as $variant) {
                $qty = rand(1, 3);
                $orderTotal += ((float) $variant->price * $qty);
                $itemRows[] = [
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $qty,
                    'price' => $variant->price,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            $order = Order::create([
                'user_id' => $customer->id,
                'shop_id' => $orderShopId,
                'total_amount' => $orderTotal,
                'payment_slip' => 'slips/sample.jpg',
                'status' => 'pending',
                'phone' => '09123456789',
                'address' => 'Yangon, Sample Address',
            ]);

            $itemRows = collect($itemRows)->map(fn (array $row) => $row + ['order_id' => $order->id])->all();

            OrderItem::insert($itemRows);
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
