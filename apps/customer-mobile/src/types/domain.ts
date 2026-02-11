export type Locale = "en" | "mm";
export type ThemeMode = "light" | "dark";
export type CustomerTab = "home" | "orders" | "cart" | "account";

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  roles?: string[];
};

export type AuthSession = {
  token: string;
  user: ApiUser;
};

export type UserProfile = {
  shop_name?: string | null;
  phone_number?: string | null;
  nrc_number?: string | null;
  address?: string | null;
  address_line_1?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
};

export type MePayload = {
  user: ApiUser;
  profile?: UserProfile | null;
  salary_preview?: {
    month: string;
    net_salary: number;
    gross_salary: number;
    deduction: number;
    worked_days: number;
    expected_days: number;
  } | null;
  message?: string;
};

export type Category = {
  id: number;
  name: string;
  slug?: string | null;
};

export type ProductVariant = {
  id: number;
  sku: string;
  price: number;
  effective_price?: number;
  base_price?: number;
  discount_amount?: number;
  discount_percent?: number;
  promotion?: {
    type?: string;
    label?: string;
    value?: number;
    value_type?: string;
  } | null;
  stock_level: number;
};

export type Product = {
  id: number;
  name: string;
  slug?: string | null;
  price: number;
  base_price?: number;
  has_discount?: boolean;
  stock_level?: number;
  image_url?: string | null;
  description?: string | null;
  brand?: { id: number; name: string } | null;
  shop?: { id: number; name: string } | null;
  category?: Category | null;
  active_variants?: ProductVariant[];
};

export type CartItem = {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  product?: Product;
  variant?: ProductVariant;
};

export type OrderItem = {
  id: number;
  order_id?: number;
  product_id: number;
  product_variant_id?: number;
  qty?: number;
  quantity: number;
  unit_price?: number;
  price: number;
  line_total: number;
  product?: Product;
  variant?: ProductVariant;
};

export type CustomerOrder = {
  id: number;
  invoice_no: string | null;
  receipt_no?: string | null;
  job_no?: string | null;
  status: string;
  total_amount: number;
  derived_total?: number;
  paid_total?: number;
  balance_due?: number;
  phone?: string | null;
  address?: string | null;
  cancel_reason?: string | null;
  payment_slip_url?: string | null;
  delivery_proof_url?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  created_at: string | null;
  shop?: { id: number; name: string } | null;
  items?: OrderItem[];
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

export type ApiListResponse<T> = {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
