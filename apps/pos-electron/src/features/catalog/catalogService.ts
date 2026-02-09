import { httpClient } from "../../core/api/httpClient";
import type { Product } from "../../core/types/contracts";

type ProductListResponse = {
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export const catalogService = {
  listProducts: (query = "") => {
    const encoded = encodeURIComponent(query);
    return httpClient.get<ProductListResponse>(`/catalog/products?q=${encoded}&active_only=1&per_page=50`);
  },
};
