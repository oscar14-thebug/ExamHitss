// TODO: shape assumed from common PLP search API conventions — not verified
// against a real captured payload from https://www.liverpool.com.mx/api/plp/search
// (browser access was unavailable while authoring this suite). Reconcile field
// names against the actual response on first live run.

export interface PlpProductPrice {
  price: number;
  listPrice?: number;
}

export interface PlpProduct {
  id: string;
  sku?: string;
  name: string;
  price: PlpProductPrice;
  colors?: string[];
}

export interface PlpPagination {
  totalResults: number;
  page?: number;
  pageSize?: number;
}

export interface PlpSearchResponse {
  products: PlpProduct[];
  pagination?: PlpPagination;
  sort?: string;
  appliedFilters?: Record<string, unknown>;
}
