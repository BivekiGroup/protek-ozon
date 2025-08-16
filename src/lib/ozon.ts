const BASE_URL = "https://api-seller.ozon.ru";

export type OzonPostResult<T = unknown> = {
  ok: boolean;
  status: number;
  statusText: string;
  data: T | null;
};

export async function ozonPost<T = unknown>(endpoint: string, body?: unknown): Promise<OzonPostResult<T>> {
  const { OZON_CLIENT_ID, OZON_API_KEY } = process.env;
  if (!OZON_CLIENT_ID || !OZON_API_KEY) {
    return {
      ok: false,
      status: 500,
      statusText: "Отсутствуют учётные данные Ozon",
      data: { error: "Отсутствуют переменные окружения OZON_CLIENT_ID или OZON_API_KEY" } as unknown as T,
    };
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": OZON_CLIENT_ID,
        "Api-Key": OZON_API_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = (await resp.json().catch(() => null)) as T | null;
    return { ok: resp.ok, status: resp.status, statusText: resp.statusText, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Неизвестная ошибка";
    return { ok: false, status: 500, statusText: message, data: null };
  }
}
