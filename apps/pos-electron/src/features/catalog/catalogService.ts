import { HttpError, httpClient } from "../../core/api/httpClient";
import type { Product } from "../../core/types/contracts";
import { sanitizeProducts } from "../../core/validation/guards";

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
  listProducts: async (query = "") => {
    const encoded = encodeURIComponent(query);
    try {
      const response = await httpClient.get<ProductListResponse>(`/catalog/products?q=${encoded}&active_only=1&per_page=100`);
      const products = sanitizeProducts(response.data);
      await window.desktopBridge.offlineCacheProducts(products);
      return {
        ...response,
        data: products,
      };
    } catch (error) {
      if (!(error instanceof HttpError) || ![0, 408].includes(error.status)) {
        throw error;
      }

      const offline = sanitizeProducts(await window.desktopBridge.offlineGetProducts(query));
      return {
        data: offline,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: offline.length,
          total: offline.length,
        },
      };
    }
  },
};
