export type ApiUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  shop_id?: number | null;
};

export type StaffProfile = {
  shop_name?: string | null;
  phone_number?: string | null;
  address?: string | null;
};

export type SalaryPreview = {
  month: string;
  net_salary: number;
  gross_salary: number;
  deduction: number;
  worked_days: number;
  expected_days: number;
};

export type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  line_total: number;
  product?: {
    id: number;
    name: string;
  };
};

export type Order = {
  id: number;
  invoice_no: string | null;
  status: string;
  total_amount: number;
  phone: string | null;
  address: string | null;
  created_at: string | null;
  payment_slip_url: string | null;
  delivery_proof_url: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_updated_at: string | null;
  items?: OrderItem[];
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
