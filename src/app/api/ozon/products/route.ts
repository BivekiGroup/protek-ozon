import { NextResponse } from "next/server";

const OZON_API_URL = "https://api-seller.ozon.ru/v3/product/list";

type OzonListRequest = {
  filter?: Record<string, unknown>;
  last_id?: string;
  limit?: number;
};

export async function POST(req: Request) {
  try {
    const { OZON_CLIENT_ID, OZON_API_KEY } = process.env;
    if (!OZON_CLIENT_ID || !OZON_API_KEY) {
      return NextResponse.json(
        { error: "Missing OZON_CLIENT_ID or OZON_API_KEY env vars" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as OzonListRequest;
    const payload: OzonListRequest = {
      filter: body.filter ?? { visibility: "ALL" },
      last_id: body.last_id ?? "",
      limit: typeof body.limit === "number" ? body.limit : 100,
    };

    const upstream = await fetch(OZON_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": OZON_CLIENT_ID,
        "Api-Key": OZON_API_KEY,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: "Ozon API error",
          status: upstream.status,
          statusText: upstream.statusText,
          data,
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

