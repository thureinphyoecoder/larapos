import { requestJson } from "../lib/http";

export type AddressSuggestion = {
  label: string;
  township?: string | null;
  state?: string | null;
};

type SuggestionsResponse = {
  data: AddressSuggestion[];
};

export async function fetchAddressSuggestions(baseUrl: string, q: string, limit = 8): Promise<AddressSuggestion[]> {
  const keyword = q.trim();
  if (keyword.length < 2) {
    return [];
  }

  const params = new URLSearchParams();
  params.set("q", keyword);
  params.set("limit", String(limit));

  const payload = await requestJson<SuggestionsResponse>({
    baseUrl,
    path: `/addresses/suggest?${params.toString()}`,
    method: "GET",
  });

  return payload.data || [];
}

