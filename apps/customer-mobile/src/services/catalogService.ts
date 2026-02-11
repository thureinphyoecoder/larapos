import { requestJson } from "../lib/http";
import { fallbackCategories, fallbackProducts } from "../mocks/data";
import type { ApiListResponse, Category, Product } from "../types/domain";

type CatalogMeta = {
  categories: Category[];
};

export async function fetchProducts(baseUrl: string, query = "", categoryId?: number | null): Promise<Product[]> {
  const q = query.trim();
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (categoryId) {
    params.set("category_id", String(categoryId));
  }

  const queryString = params.toString();

  try {
    const payload = await requestJson<ApiListResponse<Product>>({
      baseUrl,
      path: `/catalog/products${queryString ? `?${queryString}` : ""}`,
      method: "GET",
    });

    return payload.data ?? [];
  } catch {
    return fallbackProducts;
  }
}

export async function fetchCategories(baseUrl: string): Promise<Category[]> {
  try {
    const payload = await requestJson<CatalogMeta>({
      baseUrl,
      path: "/catalog/meta",
      method: "GET",
    });

    return payload.categories ?? [];
  } catch {
    return fallbackCategories;
  }
}

export async function fetchProductDetail(baseUrl: string, productId: number): Promise<Product> {
  const payload = await requestJson<{ data: Product }>({
    baseUrl,
    path: `/catalog/products/${productId}`,
    method: "GET",
  });

  return payload.data;
}
