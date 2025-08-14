export type OzonListItem = {
  archived?: boolean;
  has_fbo_stocks?: boolean;
  has_fbs_stocks?: boolean;
  is_discounted?: boolean;
  offer_id?: string;
  product_id?: number;
  quants?: Array<{ quant_code?: string; quant_size?: number }>;
};

export type ProductInfo = {
  id?: number;
  name?: string;
  offer_id?: string;
  primary_image?: string[];
  images?: string[];
  price?: number | string;
  old_price?: number | string;
  marketing_price?: number | string;
  min_price?: number | string;
  currency_code?: string;
  created_at?: string;
  updated_at?: string;
  sources?: Array<{ sku?: string }>;
  statuses?: unknown;
  stocks?: unknown;
};

export type ProductAttrs = {
  id?: number;
  name?: string;
  primary_image?: string;
  images?: string[];
  height?: number;
  width?: number;
  depth?: number;
  dimension_unit?: string;
  weight?: number;
  weight_unit?: string;
  sku?: string;
  attributes?: Array<{ id: number; values?: Array<{ value?: string }> }>;
};

export type OzonListResponse = {
  result?: { items?: OzonListItem[]; total?: number; last_id?: string };
} | null;

export type OzonInfoResponse = { items?: ProductInfo[] } | null;

export type OzonAttrsResponse = { result?: ProductAttrs[] } | null;

