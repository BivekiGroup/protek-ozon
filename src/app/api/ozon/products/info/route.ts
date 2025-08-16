import { NextResponse } from "next/server";
import { ozonPost } from "@/lib/ozon";

const OZON_API_URL = "/v3/product/info/list";

type InfoBody = {
  offer_id?: string[];
  product_id?: string[];
  sku?: string[];
};

export async function POST(req: Request) {
  try {
    const raw = (await req.json().catch(() => ({}))) as InfoBody;
    const normalize = (v?: unknown) => Array.isArray(v) ? v.map(String) : undefined;
    const body: InfoBody = {
      offer_id: normalize(raw?.offer_id),
      product_id: normalize(raw?.product_id),
      sku: normalize(raw?.sku),
    };
    const { ok, status, statusText, data } = await ozonPost(OZON_API_URL, body);
    if (!ok) {
      return NextResponse.json(
        {
          error: "Ошибка ответа Ozon API",
          status,
          statusText,
          data,
        },
        { status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
