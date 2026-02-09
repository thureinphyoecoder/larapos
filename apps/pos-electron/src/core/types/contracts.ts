export type User = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  shop_id: number | null;
};

export type Variant = {
  id: number;
  product_id: number;
  sku: string;
  price: number;
  stock_level: number;
  is_active: boolean;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_level: number;
  description: string | null;
  active_variants?: Variant[];
};

export type OrderItemInput = {
  variant_id: number;
  quantity: number;
};

export type Order = {
  id: number;
  status: string;
  total_amount: number;
  phone: string;
  address: string;
  created_at: string;
};
