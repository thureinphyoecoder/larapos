import type { Locale } from "../types/domain";

type I18nKey =
  | "appName"
  | "appTagline"
  | "loginTitle"
  | "loginSubtitle"
  | "name"
  | "email"
  | "password"
  | "signIn"
  | "signingIn"
  | "demoHint"
  | "tabsHome"
  | "tabsOrders"
  | "tabsCart"
  | "tabsAccount"
  | "welcomeBack"
  | "homeWelcomeSubtitle"
  | "discoverProducts"
  | "itemsFound"
  | "all"
  | "searchPlaceholder"
  | "categories"
  | "featuredProducts"
  | "noProducts"
  | "addToCart"
  | "adding"
  | "sale"
  | "flashSale"
  | "inStock"
  | "outOfStock"
  | "stockLeft"
  | "fromLabel"
  | "viewDetails"
  | "variant"
  | "quantity"
  | "productDetails"
  | "orderDetails"
  | "description"
  | "orderItems"
  | "noOrderItems"
  | "customerPhone"
  | "deliveryAddress"
  | "statusLabel"
  | "back"
  | "ordersTitle"
  | "ordersSubtitle"
  | "ordersEmpty"
  | "cartTitle"
  | "cartSubtitle"
  | "cartEmpty"
  | "subtotal"
  | "cartSummary"
  | "checkout"
  | "checkingOut"
  | "remove"
  | "removing"
  | "accountTitle"
  | "accountSubtitle"
  | "accountProfile"
  | "saveProfile"
  | "savingProfile"
  | "profileUpdated"
  | "profileUpdateFailed"
  | "nameEmailRequired"
  | "phoneNumber"
  | "nrcNumber"
  | "addressLine"
  | "city"
  | "stateRegion"
  | "postalCode"
  | "language"
  | "theme"
  | "logout"
  | "light"
  | "dark"
  | "retry"
  | "invalidCredentials"
  | "networkError"
  | "unknownError"
  | "total"
  | "itemCount"
  | "pullToRefresh"
  | "notificationTitle"
  | "notificationMsg"
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_requested"
  | "refunded"
  | "return_requested"
  | "returned"
  | "orderActions"
  | "cancelOrder"
  | "requestRefund"
  | "requestReturn"
  | "reasonPlaceholder"
  | "submitRequest"
  | "orderCancelledSuccess"
  | "refundRequestedSuccess"
  | "returnRequestedSuccess";

type Dictionary = Record<I18nKey, string>;

const en: Dictionary = {
  appName: "LaraPee",
  appTagline: "Shop smarter, checkout faster",
  loginTitle: "Customer Sign In",
  loginSubtitle: "Access your orders, cart and profile in one place.",
  name: "Name",
  email: "Email",
  password: "Password",
  signIn: "Sign In",
  signingIn: "Signing in...",
  demoHint: "Use your existing customer account.",
  tabsHome: "Home",
  tabsOrders: "Orders",
  tabsCart: "Cart",
  tabsAccount: "Account",
  welcomeBack: "Welcome back",
  homeWelcomeSubtitle: "Premium deals from verified shops, updated live.",
  discoverProducts: "Discover Products",
  itemsFound: "items found",
  all: "All",
  searchPlaceholder: "Search products or shops",
  categories: "Categories",
  featuredProducts: "Featured Products",
  noProducts: "No products matched your filters.",
  addToCart: "Add to cart",
  adding: "Adding...",
  sale: "Sale",
  flashSale: "Flash Sale",
  inStock: "In stock",
  outOfStock: "Out of stock",
  stockLeft: "left",
  fromLabel: "from",
  viewDetails: "View details",
  variant: "Variant",
  quantity: "Qty",
  productDetails: "Product Details",
  orderDetails: "Order Details",
  description: "Description",
  orderItems: "Order Items",
  noOrderItems: "No order items found.",
  customerPhone: "Phone",
  deliveryAddress: "Address",
  statusLabel: "Status",
  back: "Back",
  ordersTitle: "My Orders",
  ordersSubtitle: "Track status updates grouped by date.",
  ordersEmpty: "No orders yet.",
  cartTitle: "My Cart",
  cartSubtitle: "Review your items before placing order.",
  cartEmpty: "Your cart is empty.",
  subtotal: "Subtotal",
  cartSummary: "Order Summary",
  checkout: "Place Order",
  checkingOut: "Placing order...",
  remove: "Remove",
  removing: "Removing...",
  accountTitle: "Account",
  accountSubtitle: "Manage your profile and preferences.",
  accountProfile: "Profile Information",
  saveProfile: "Save Profile",
  savingProfile: "Saving...",
  profileUpdated: "Profile updated successfully.",
  profileUpdateFailed: "Unable to update profile right now.",
  nameEmailRequired: "Name and email are required.",
  phoneNumber: "Phone Number",
  nrcNumber: "NRC Number",
  addressLine: "Address",
  city: "City",
  stateRegion: "State/Region",
  postalCode: "Postal Code",
  language: "Language",
  theme: "Theme",
  logout: "Logout",
  light: "Light",
  dark: "Dark",
  retry: "Retry",
  invalidCredentials: "Invalid email or password.",
  networkError: "Network unavailable. Please check API URL and connection.",
  unknownError: "Something went wrong. Please try again.",
  total: "Total",
  itemCount: "items",
  pullToRefresh: "Pull down to refresh",
  notificationTitle: "Order update",
  notificationMsg: "New status updates are available.",
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_requested: "Refund Requested",
  refunded: "Refunded",
  return_requested: "Return Requested",
  returned: "Returned",
  orderActions: "Order Actions",
  cancelOrder: "Cancel Order",
  requestRefund: "Request Refund",
  requestReturn: "Request Return",
  reasonPlaceholder: "Write your reason here...",
  submitRequest: "Submit Request",
  orderCancelledSuccess: "Order cancelled successfully.",
  refundRequestedSuccess: "Refund request sent.",
  returnRequestedSuccess: "Return request sent.",
};

const mm: Dictionary = {
  appName: "LaraPee",
  appTagline: "ဈေးဝယ်မှုမြန်မြန်၊ Checkout လုံခြုံစိတ်ချ",
  loginTitle: "Customer Login",
  loginSubtitle: "Order၊ Cart နဲ့ Profile ကို တစ်နေရာတည်းက စီမံနိုင်ပါတယ်။",
  name: "အမည်",
  email: "အီးမေးလ်",
  password: "စကားဝှက်",
  signIn: "ဝင်မည်",
  signingIn: "ဝင်နေပါသည်...",
  demoHint: "ရှိပြီးသား customer account နဲ့ဝင်ပါ။",
  tabsHome: "ပင်မ",
  tabsOrders: "အော်ဒါ",
  tabsCart: "ခြင်းတောင်း",
  tabsAccount: "အကောင့်",
  welcomeBack: "ပြန်လည်ကြိုဆိုပါတယ်",
  homeWelcomeSubtitle: "ယုံကြည်ရတဲ့ဆိုင်တွေက deals အသစ်တွေကို အချိန်နှင့်တပြေးညီ ကြည့်နိုင်ပါတယ်။",
  discoverProducts: "ပစ္စည်းများ စူးစမ်းမည်",
  itemsFound: "ခု တွေ့ရှိ",
  all: "အားလုံး",
  searchPlaceholder: "ပစ္စည်း၊ ဆိုင်နာမည် ရှာမယ်",
  categories: "အမျိုးအစားများ",
  featuredProducts: "အထူးရွေးချယ်ထားသော ပစ္စည်းများ",
  noProducts: "ရွေးချယ်မှုနဲ့ကိုက်ညီတဲ့ ပစ္စည်းမတွေ့ပါ။",
  addToCart: "ခြင်းတောင်းထဲထည့်မည်",
  adding: "ထည့်နေပါသည်...",
  sale: "လျှော့ဈေး",
  flashSale: "Flash Sale",
  inStock: "ရှိနေသည်",
  outOfStock: "ပြတ်နေသည်",
  stockLeft: "ကျန်",
  fromLabel: "စတင်",
  viewDetails: "အသေးစိတ်ကြည့်မည်",
  variant: "Variant",
  quantity: "အရေအတွက်",
  productDetails: "ပစ္စည်း အသေးစိတ်",
  orderDetails: "အော်ဒါ အသေးစိတ်",
  description: "ဖော်ပြချက်",
  orderItems: "အော်ဒါပစ္စည်းများ",
  noOrderItems: "အော်ဒါပစ္စည်း မတွေ့ပါ။",
  customerPhone: "ဖုန်းနံပါတ်",
  deliveryAddress: "လိပ်စာ",
  statusLabel: "အခြေအနေ",
  back: "နောက်သို့",
  ordersTitle: "ကျွန်တော့် အော်ဒါများ",
  ordersSubtitle: "ရက်စွဲအလိုက် grouped လုပ်ပြီး order status ကိုကြည့်နိုင်ပါတယ်။",
  ordersEmpty: "အော်ဒါမရှိသေးပါ။",
  cartTitle: "ခြင်းတောင်း",
  cartSubtitle: "အော်ဒါတင်မတင်မီ ပစ္စည်းများ စစ်ဆေးပါ။",
  cartEmpty: "ခြင်းတောင်းထဲမှာ ပစ္စည်းမရှိသေးပါ။",
  subtotal: "စုစုပေါင်း",
  cartSummary: "အော်ဒါအနှစ်ချုပ်",
  checkout: "အော်ဒါတင်မည်",
  checkingOut: "အော်ဒါတင်နေပါသည်...",
  remove: "ဖယ်ရှားမည်",
  removing: "ဖယ်ရှားနေပါသည်...",
  accountTitle: "အကောင့်",
  accountSubtitle: "ကိုယ်ရေးအချက်အလက်နဲ့ preference တွေကို စီမံနိုင်ပါတယ်။",
  accountProfile: "ကိုယ်ရေးအချက်အလက်",
  saveProfile: "Profile သိမ်းမည်",
  savingProfile: "သိမ်းနေပါသည်...",
  profileUpdated: "Profile အောင်မြင်စွာ ပြင်ပြီးပါပြီ။",
  profileUpdateFailed: "Profile update မအောင်မြင်ပါ။",
  nameEmailRequired: "အမည်နှင့် အီးမေးလ် ဖြည့်ရန်လိုအပ်ပါသည်။",
  phoneNumber: "ဖုန်းနံပါတ်",
  nrcNumber: "NRC နံပါတ်",
  addressLine: "လိပ်စာ",
  city: "မြို့",
  stateRegion: "တိုင်း/ပြည်နယ်",
  postalCode: "စာတိုက်နံပါတ်",
  language: "ဘာသာစကား",
  theme: "အရောင်ပုံစံ",
  logout: "ထွက်မည်",
  light: "Light",
  dark: "Dark",
  retry: "ပြန်စမ်းမည်",
  invalidCredentials: "Email (သို့) Password မမှန်ပါ။",
  networkError: "Network မရပါ။ API URL နဲ့ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ပါ။",
  unknownError: "အမှားတစ်ခု ဖြစ်ပွားနေပါတယ်။ ထပ်စမ်းပါ။",
  total: "စုစုပေါင်း",
  itemCount: "ခု",
  pullToRefresh: "Refresh လုပ်ရန် အောက်ဆွဲပါ",
  notificationTitle: "Order အခြေအနေပြောင်းလဲမှု",
  notificationMsg: "Order status အသစ်များ ရောက်ရှိနေပါသည်။",
  pending: "စောင့်ဆိုင်း",
  confirmed: "အတည်ပြုပြီး",
  shipped: "ပို့ဆောင်နေ",
  delivered: "ပို့ပြီး",
  cancelled: "ပယ်ဖျက်",
  refund_requested: "Refund တောင်းဆိုပြီး",
  refunded: "Refund ပြန်ပြီး",
  return_requested: "Return တောင်းဆိုပြီး",
  returned: "ပြန်လည်ရယူပြီး",
  orderActions: "အော်ဒါ လုပ်ဆောင်ချက်များ",
  cancelOrder: "အော်ဒါပယ်ဖျက်မည်",
  requestRefund: "Refund တောင်းမည်",
  requestReturn: "Return တောင်းမည်",
  reasonPlaceholder: "အကြောင်းပြချက် ရေးပါ...",
  submitRequest: "တောင်းဆိုချက်ပို့မည်",
  orderCancelledSuccess: "အော်ဒါကို ပယ်ဖျက်ပြီးပါပြီ။",
  refundRequestedSuccess: "Refund တောင်းဆိုပြီးပါပြီ။",
  returnRequestedSuccess: "Return တောင်းဆိုပြီးပါပြီ။",
};

const dictionaries: Record<Locale, Dictionary> = { en, mm };

export function tr(locale: Locale, key: I18nKey): string {
  return dictionaries[locale][key] || dictionaries.en[key] || key;
}
