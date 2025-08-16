"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

import type { OzonListResponse, ProductInfo, ProductAttrs, OzonListItem } from "@/types/ozon";
import { formatCurrency } from "@/lib/format";

export default function Home() {
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
  const [offerQuery, setOfferQuery] = useState("");
  const [skuQuery, setSkuQuery] = useState("");
  const [titleQuery, setTitleQuery] = useState("");
  const [visibility, setVisibility] = useState("ALL");
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<string | undefined>(undefined);
  const [itemsAcc, setItemsAcc] = useState<OzonListItem[]>([]);

  const fetchData = async (opts?: { limit?: number; last_id?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ozon/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: {
            visibility: visibility || "ALL",
            ...(offerQuery ? { offer_id: [offerQuery] } : {}),
            ...(skuQuery ? { sku: [skuQuery] } : {}),
          },
          limit: typeof opts?.limit === "number" ? opts!.limit : limit,
          last_id: typeof opts?.last_id === "string" ? opts!.last_id : lastId,
        }),
      });
      const json = (await res.json()) as OzonListResponse;
      if (!res.ok) {
        throw new Error((json as { error?: string } | null)?.error || res.statusText);
      }
      setData(json);
      setItemsAcc((prev) => (lastId ? [...prev, ...(json?.result?.items ?? [])] : (json?.result?.items ?? [])));
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
      const message = e instanceof Error ? e.message : "Unknown error";
      setError((prev) => (prev ? prev + `; info: ${message}` : `info: ${message}`));
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
      setError((prev) => (prev ? prev + `; attrs: ${message}` : `attrs: ${message}`));
      toast({ title: "Ошибка атрибутов", description: message, variant: "destructive" });
      setAttrsById({});
    } finally {
      setAttrsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const items = useMemo(() => data?.result?.items ?? [], [data]);
  const total = data?.result?.total ?? 0;
  const nextLastId = data?.result?.last_id ?? "";

  // Infinite scroll: наблюдаем за нижним стражем
  useEffect(() => {
    const sentinel = document.getElementById('scroll-sentinel');
    if (!sentinel) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && nextLastId && !loading) {
        setLastId(nextLastId);
        fetchData({ last_id: nextLastId, limit });
      }
    }, { rootMargin: '200px' });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [nextLastId, loading, limit]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Товары Ozon" }]} />
          <h1 className="text-2xl font-semibold">Товары Ozon</h1>
        </div>
        <Link href="/ozon/products" className="text-xs text-slate-500 hover:underline">альтернативный список</Link>
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
        <label className="flex flex-col text-sm">
          <span className="mb-1">Видимость</span>
          <select className="border rounded h-9 px-2" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="ALL">ALL</option>
            <option value="VISIBLE">VISIBLE</option>
            <option value="INVISIBLE">INVISIBLE</option>
          </select>
        </label>
        <label className="flex flex-col text-sm flex-1 min-w-[200px]">
          <span className="mb-1">Маркер страницы (last_id)</span>
          <Input
            type="text"
            value={lastId}
            onChange={(e) => setLastId(e.target.value)}
            placeholder="оставьте пустым для первой страницы"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1">Артикул (offer_id)</span>
          <Input value={offerQuery} onChange={(e) => setOfferQuery(e.target.value)} placeholder="например, 21470" className="w-44" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1">SKU</span>
          <Input value={skuQuery} onChange={(e) => setSkuQuery(e.target.value)} placeholder="например, 423434534" className="w-44" />
        </label>
        <label className="flex flex-col text-sm flex-1 min-w-[160px]">
          <span className="mb-1">Название (клиентский фильтр)</span>
          <Input value={titleQuery} onChange={(e) => setTitleQuery(e.target.value)} placeholder="начните вводить..." />
        </label>
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
        <Button
          variant="secondary"
          onClick={() => {
            setLastId("");
            setItemsAcc([]);
            fetchData({ last_id: "", limit });
          }}
          disabled={loading}
        >
          Сбросить
        </Button>
      </div>

      {error && <div className="text-red-600 text-sm">Ошибка: {error}</div>}

      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>Всего: {total}</div>
        <div className="text-xs">следующий маркер: {nextLastId || "—"}</div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(titleQuery ? itemsAcc.filter((it) => {
            const name = detailsById[it.product_id ?? 0]?.name || attrsById[it.product_id ?? 0]?.name || '';
            return name.toLowerCase().includes(titleQuery.toLowerCase());
          }) : itemsAcc)?.length ? (
          (titleQuery ? itemsAcc.filter((it) => {
            const name = detailsById[it.product_id ?? 0]?.name || attrsById[it.product_id ?? 0]?.name || '';
            return name.toLowerCase().includes(titleQuery.toLowerCase());
          }) : itemsAcc).map((it, idx) => {
            const pid = it.product_id ?? 0;
            const info = detailsById[pid] ?? {};
            const attr = attrsById[pid] ?? {};
            const img = info?.primary_image?.[0] || info?.images?.[0] || attr?.primary_image || attr?.images?.[0];
            return (
              <Link key={`${pid}-${idx}`} href={`/product/${pid}`} className="block">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="truncate">{info?.name || it.offer_id || "Без названия"}</CardTitle>
                    <CardDescription className="truncate">Артикул: {it.offer_id ?? "—"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {img ? (
                        <img src={img} alt={info?.name || it.offer_id || "product image"} className="w-full h-40 object-cover rounded" loading="lazy" />
                      ) : (
                        <div className="w-full h-40 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">Нет изображения</div>
                      )}
                      <div className="flex items-baseline gap-2">
                        {info?.price ? <span className="text-base font-semibold">{formatCurrency(info.price)}</span> : null}
                        {info?.old_price ? <span className="text-xs line-through text-slate-400">{formatCurrency(info.old_price)}</span> : null}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {it.archived ? <Badge variant="destructive">Архив</Badge> : null}
                        {it.is_discounted ? <Badge>Скидка</Badge> : null}
                        {it.has_fbo_stocks ? <Badge variant="secondary">FBO</Badge> : null}
                        {it.has_fbs_stocks ? <Badge variant="secondary">FBS</Badge> : null}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">ozon</span>
                    <span className="text-[10px] text-slate-400">id: {pid || "—"}</span>
                  </CardFooter>
                </Card>
              </Link>
            );
          })
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

      <div id="scroll-sentinel" className="h-6" />
      {(infoLoading || attrsLoading) ? (
        <div className="text-xs text-slate-500">загрузка {infoLoading ? 'деталей' : ''}{infoLoading && attrsLoading ? ' и ' : ''}{attrsLoading ? 'атрибутов' : ''}…</div>
      ) : null}
    </div>
  );
}
