import { NextResponse } from "next/server";
import { ozonPost } from "@/lib/ozon";

const OZON_API_URL = "/v4/product/info/attributes";

type AttributesBody = {
  filter?: Record<string, unknown>;
  last_id?: string;
  limit?: number;
  sort_by?: string;
  sort_dir?: string;
};

export async function POST(req: Request) {
  try {
    const raw = (await req.json().catch(() => ({}))) as AttributesBody;
    // Лёгкая валидация / нормализация
    const errors: string[] = [];
    const limit = typeof raw?.limit === 'number' ? raw.limit : undefined;
    if (limit !== undefined && (limit < 1 || limit > 1000)) errors.push('limit должен быть 1..1000');
    const sort_dir = raw?.sort_dir ? String(raw.sort_dir).toLowerCase() : undefined;
    const sort_by = raw?.sort_by ? String(raw.sort_by) : undefined;
    const body: AttributesBody = {
      filter: (raw?.filter && typeof raw.filter === 'object') ? raw.filter : undefined,
      last_id: typeof raw?.last_id === 'string' ? raw.last_id : undefined,
      limit,
      sort_by,
      sort_dir: sort_dir ? (sort_dir === 'asc' ? 'ASC' : sort_dir === 'desc' ? 'DESC' : undefined) : undefined,
    };
    if (errors.length) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    }
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
