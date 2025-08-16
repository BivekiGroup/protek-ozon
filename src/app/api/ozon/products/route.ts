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
        { error: "Отсутствуют переменные окружения OZON_CLIENT_ID или OZON_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as OzonListRequest;

    // Простая валидация входных данных
    const errors: string[] = [];
    const filter = (body?.filter && typeof body.filter === 'object') ? body.filter : { visibility: 'ALL' };
    const limit = typeof body?.limit === 'number' ? body.limit : 100;
    const last_id = typeof body?.last_id === 'string' ? body.last_id : '';
    if (typeof last_id !== 'string') errors.push('Поле last_id должно быть строкой');
    if (typeof limit !== 'number' || limit < 1 || limit > 1000) errors.push('Поле limit должно быть числом 1..1000');

    if (errors.length) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    }

    const payload: OzonListRequest = { filter, last_id, limit };

    const upstream = await fetch(OZON_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": OZON_CLIENT_ID,
        "Api-Key": OZON_API_KEY,
      },
      body: JSON.stringify(payload),
      // лёгкий кеш для снижения нагрузки
      next: { revalidate: 30 },
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: "Ошибка ответа Ozon API",
          status: upstream.status,
          statusText: upstream.statusText,
          data,
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
