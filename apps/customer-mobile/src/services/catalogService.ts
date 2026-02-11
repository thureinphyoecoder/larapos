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

    return (payload.data ?? []).map((product) => normalizeProduct(baseUrl, product));
  } catch {
    return fallbackProducts.map((product) => normalizeProduct(baseUrl, product));
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

  return normalizeProduct(baseUrl, payload.data);
}

export async function submitProductReview(
  baseUrl: string,
  token: string,
  productId: number,
  payload: { rating?: number | null; comment?: string },
): Promise<void> {
  await requestJson({
    baseUrl,
    path: `/catalog/products/${productId}/reviews`,
    method: "POST",
    token,
    body: {
      rating: payload.rating ?? null,
      comment: payload.comment?.trim() || null,
    },
  });
}

function normalizeProduct(baseUrl: string, product: Product): Product {
  const imageUrl = toAbsoluteUrl(baseUrl, product.image_url);

  return {
    ...product,
    image_url: imageUrl,
  };
}

function toAbsoluteUrl(baseUrl: string, value?: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const origin = stripApiPath(baseUrl);
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${origin}${normalizedPath}`;
}

function stripApiPath(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  const index = normalized.indexOf("/api/");
  if (index >= 0) {
    return normalized.slice(0, index);
  }

  return normalized;
}
