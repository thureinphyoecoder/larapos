import { httpClient } from "../../core/api/httpClient";
import type { User } from "../../core/types/contracts";

export const customerService = {
  listCustomers: () => httpClient.get<{ data: User[]; meta: Record<string, number> }>("/customers?per_page=30"),
};
