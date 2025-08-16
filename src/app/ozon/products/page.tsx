"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import type { OzonListResponse, ProductInfo, ProductAttrs } from "@/types/ozon";
import { formatCurrency } from "@/lib/format";

export default function OzonProductsDemoPage() {
  const { toast } = useToast();
  const [data, setData] = useState<OzonListResponse>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(100);
  const [lastId, setLastId] = useState<string>("");
  const [detailsById, setDetailsById] = useState<Record<number, ProductInfo>>({});
  const [infoLoading, setInfoLoading] = useState(false);
  const [attrsById, setAttrsById] = useState<Record<number, ProductAttrs>>({});
  const [attrsLoading, setAttrsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([""]); // stack of last_id used
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<string | undefined>(undefined);

  const fetchData = async (opts?: { limit?: number; last_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ozon/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: { visibility: "ALL" },
          limit: typeof opts?.limit === "number" ? opts!.limit : limit,
          last_id: typeof opts?.last_id === "string" ? opts!.last_id : lastId,
        }),
      });
      const json = (await res.json()) as OzonListResponse;
      if (!res.ok) {
        throw new Error((json as { error?: string } | null)?.error || res.statusText);
      }
      setData(json);
      // After list comes, fetch info details and attributes for current page
      const productIds = (json?.result?.items ?? [])
        .map((it) => it?.product_id)
        .filter((v): v is number => typeof v === "number");
      if (productIds.length) {
        await Promise.all([
          fetchDetailsByProductIds(productIds),
          fetchAttributesByProductIds(productIds),
        ]);
      } else {
        setDetailsById({});
        setAttrsById({});
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      toast({ title: "Ошибка загрузки списка", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailsByProductIds = async (ids: number[]) => {
    setInfoLoading(true);
    try {
      // API expects strings per schema; safe to coerce
      const body = { product_id: ids.map((id) => String(id)) };
      const res = await fetch("/api/ozon/products/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { items?: ProductInfo[] };
      if (!res.ok) throw new Error(((json as unknown) as { error?: string })?.error || res.statusText);
      const map: Record<number, ProductInfo> = {};
      for (const item of (json?.items ?? [])) {
        if (typeof item?.id === "number") {
          map[item.id] = item;
        }
      }
      setDetailsById(map);
    } catch (e) {
      // swallow errors to not block list UI; show combined error
      const message = e instanceof Error ? e.message : "Unknown error";
      setError((prev) => prev ? prev + `; info: ${message}` : `info: ${message}`);
      toast({ title: "Ошибка деталей", description: message, variant: "destructive" });
      setDetailsById({});
    } finally {
      setInfoLoading(false);
    }
  };

  const fetchAttributesByProductIds = async (ids: number[]) => {
    setAttrsLoading(true);
    try {
      const body = {
        filter: {
          product_id: ids.map((id) => String(id)),
          visibility: "ALL",
        },
        limit: Math.min(ids.length, 1000),
        ...(sortBy ? { sort_by: sortBy } : {}),
        ...(sortDir ? { sort_dir: sortDir } : {}),
      };
      const res = await fetch("/api/ozon/products/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { result?: ProductAttrs[] };
      if (!res.ok) throw new Error(((json as unknown) as { error?: string })?.error || res.statusText);
      const map: Record<number, ProductAttrs> = {};
      for (const item of (json?.result ?? [])) {
        if (typeof item?.id === "number") {
          map[item.id] = item;
        }
      }
      setAttrsById(map);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError((prev) => prev ? prev + `; attrs: ${message}` : `attrs: ${message}`);
      toast({ title: "Ошибка атрибутов", description: message, variant: "destructive" });
      setAttrsById({});
    } finally {
      setAttrsLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(() => data?.result?.items ?? [], [data]);
  const total = data?.result?.total ?? 0;
  const nextLastId = data?.result?.last_id ?? "";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="space-y-1">
        <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Ozon Products" }]} />
        <h1 className="text-2xl font-semibold">Товары Ozon (демо)</h1>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1">Лимит</span>
          <Input
            type="number"
            min={1}
            max={1000}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-32"
          />
        </label>
        <label className="flex flex-col text-sm flex-1 min-w-[200px]">
          <span className="mb-1">Маркер страницы (last_id)</span>
          <Input
            type="text"
            value={lastId}
            onChange={(e) => setLastId(e.target.value)}
            placeholder="leave empty for first page"
          />
        </label>
        <div className="flex items-end gap-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1">Сортировка атрибутов</span>
            <div className="flex gap-2">
              <select className="border rounded h-9 px-2" value={sortBy ?? ''} onChange={(e) => setSortBy(e.target.value || undefined)}>
                <option value="">—</option>
                <option value="sku">sku</option>
                <option value="offer_id">offer_id</option>
                <option value="id">id</option>
                <option value="title">title</option>
              </select>
              <select className="border rounded h-9 px-2" value={sortDir ?? ''} onChange={(e) => setSortDir(e.target.value || undefined)}>
                <option value="">—</option>
                <option value="asc">asc</option>
                <option value="desc">desc</option>
              </select>
            </div>
          </label>
          <Button onClick={() => fetchData()} disabled={loading}>
            {loading ? "Загрузка..." : "Обновить"}
          </Button>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setLastId("");
            fetchData({ last_id: "", limit });
          }}
          disabled={loading}
        >
          Сбросить
        </Button>
      </div>

      {error && (
        <div className="text-red-600 text-sm">Error: {error}</div>
      )}

        <div className="text-sm text-slate-600">Всего: {total}</div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items?.length ? (
          items.map((it, idx) => (
            <Card key={`${it.product_id ?? it.offer_id}-${idx}`}>
              <CardHeader>
                <CardTitle className="truncate">
                  {detailsById[it.product_id ?? 0]?.name || it.offer_id || "No name"}
                </CardTitle>
                <CardDescription className="truncate">
                  offer_id: {it.offer_id ?? "—"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {detailsById[it.product_id ?? 0]?.images?.[0] || detailsById[it.product_id ?? 0]?.primary_image?.[0] ? (
                    // Use plain img to avoid next.config remote domains setup
                    <img
                      src={
                        detailsById[it.product_id ?? 0]?.primary_image?.[0] ||
                        detailsById[it.product_id ?? 0]?.images?.[0]
                      }
                      alt={detailsById[it.product_id ?? 0]?.name || it.offer_id || "product image"}
                      className="w-full h-40 object-cover rounded"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-40 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">
                      Нет изображения
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    {detailsById[it.product_id ?? 0]?.price ? (
                      <span className="text-base font-semibold">
                        {formatCurrency(detailsById[it.product_id ?? 0]?.price)}
                      </span>
                    ) : null}
                    {detailsById[it.product_id ?? 0]?.old_price ? (
                      <span className="text-xs line-through text-slate-400">
                        {formatCurrency(detailsById[it.product_id ?? 0]?.old_price)}
                      </span>
                    ) : null}
                  </div>
                  {/* Dimensions / weight from attributes endpoint */}
                  {attrsById[it.product_id ?? 0] ? (
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      {typeof attrsById[it.product_id ?? 0]?.height === "number" && (
                        <div>H: {attrsById[it.product_id ?? 0]?.height}{attrsById[it.product_id ?? 0]?.dimension_unit ? ` ${attrsById[it.product_id ?? 0]?.dimension_unit}` : ''}</div>
                      )}
                      {typeof attrsById[it.product_id ?? 0]?.width === "number" && (
                        <div>W: {attrsById[it.product_id ?? 0]?.width}{attrsById[it.product_id ?? 0]?.dimension_unit ? ` ${attrsById[it.product_id ?? 0]?.dimension_unit}` : ''}</div>
                      )}
                      {typeof attrsById[it.product_id ?? 0]?.depth === "number" && (
                        <div>D: {attrsById[it.product_id ?? 0]?.depth}{attrsById[it.product_id ?? 0]?.dimension_unit ? ` ${attrsById[it.product_id ?? 0]?.dimension_unit}` : ''}</div>
                      )}
                      {typeof attrsById[it.product_id ?? 0]?.weight === "number" && (
                        <div>Weight: {attrsById[it.product_id ?? 0]?.weight}{attrsById[it.product_id ?? 0]?.weight_unit ? ` ${attrsById[it.product_id ?? 0]?.weight_unit}` : ''}</div>
                      )}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {it.archived ? <Badge variant="destructive">Архив</Badge> : null}
                    {it.is_discounted ? <Badge>Скидка</Badge> : null}
                    {it.has_fbo_stocks ? <Badge variant="secondary">FBO</Badge> : null}
                    {it.has_fbs_stocks ? <Badge variant="secondary">FBS</Badge> : null}
                  </div>
                  {!!it.quants?.length && (
                    <div className="pt-1">
                      quants: {it.quants.map((q) => `${q.quant_code ?? ''}:${q.quant_size ?? ''}`).join(", ")}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <span className="text-xs text-slate-500">ozon</span>
                <span className="text-[10px] text-slate-400">id: {it.product_id ?? "—"}</span>
              </CardFooter>
            </Card>
          ))
        ) : (
          loading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-40 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-12" />
                  </CardFooter>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-sm text-slate-600">Нет товаров</div>
          )
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => {
            setHistory((h) => [...h, nextLastId || ""]);
            setLastId(nextLastId);
            fetchData({ last_id: nextLastId, limit });
          }}
          disabled={loading || !nextLastId}
        >
          Вперёд
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setHistory((h) => {
              if (h.length <= 1) return h;
              const copy = [...h];
              copy.pop();
              const prev = copy[copy.length - 1] ?? "";
              setLastId(prev);
              fetchData({ last_id: prev, limit });
              return copy;
            });
          }}
          disabled={loading || history.length <= 1}
        >
          Назад
        </Button>
        <div className="text-xs text-slate-500">следующий маркер: {nextLastId || "—"}</div>
        {(infoLoading || attrsLoading) ? (
          <div className="text-xs text-slate-500">загрузка {infoLoading ? 'деталей' : ''}{infoLoading && attrsLoading ? ' и ' : ''}{attrsLoading ? 'атрибутов' : ''}…</div>
        ) : null}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-slate-600">Сырой ответ</summary>
        <pre className="text-xs bg-gray-50 border rounded p-4 overflow-auto mt-2">
          {data ? JSON.stringify(data, null, 2) : loading ? "Загрузка..." : "Нет данных"}
        </pre>
      </details>
    </div>
  );
}
