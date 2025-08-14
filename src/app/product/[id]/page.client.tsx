"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import type { ProductInfo, ProductAttrs } from "@/types/ozon";

type Props = { id: string };

export default function ClientPage({ id }: Props) {
  const productId = id;
  const [info, setInfo] = useState<ProductInfo | null>(null);
  const [attrs, setAttrs] = useState<ProductAttrs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<string>("info");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const infoRes = await fetch("/api/ozon/products/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: [String(productId)] }),
        });
        const infoJson = await infoRes.json();
        if (!infoRes.ok) throw new Error(infoJson?.error || infoRes.statusText);
        setInfo(infoJson?.items?.[0] ?? null);

        const attrsRes = await fetch("/api/ozon/products/attributes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filter: { product_id: [String(productId)], visibility: "ALL" },
            limit: 1,
          }),
        });
        const attrsJson = await attrsRes.json();
        if (!attrsRes.ok) throw new Error(attrsJson?.error || attrsRes.statusText);
        setAttrs(attrsJson?.result?.[0] ?? null);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        toast({ title: "Ошибка загрузки товара", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [productId, toast]);

  const title = info?.name || attrs?.name || `Product ${productId}`;
  const gallery: string[] = useMemo(() => {
    const imgs: string[] = [];
    if (Array.isArray(info?.primary_image)) imgs.push(...info.primary_image);
    if (Array.isArray(info?.images)) imgs.push(...info.images);
    if (attrs?.primary_image) imgs.push(attrs.primary_image);
    if (Array.isArray(attrs?.images)) imgs.push(...attrs.images);
    const unique = Array.from(new Set(imgs));
    if (!selectedImage && unique.length) setSelectedImage(unique[0]);
    return unique;
  }, [info, attrs, selectedImage]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: `Товар ${productId}` }]} />
          <h1 className="text-2xl font-semibold truncate">{title}</h1>
        </div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Назад к списку</Link>
      </div>

      {error && <div className="text-red-600 text-sm">Error: {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gallery */}
        <div className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="w-full aspect-[4/3]" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-24" />
                ))}
              </div>
            </>
          ) : gallery.length ? (
            <>
              <img src={selectedImage ?? gallery[0]} alt={title} className="w-full aspect-[4/3] object-cover rounded" />
              {gallery.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {gallery.slice(0, 8).map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${title} ${i + 1}`}
                      className={"w-full h-24 object-cover rounded cursor-pointer " + (src === selectedImage ? "ring-2 ring-black" : "")}
                      onClick={() => setSelectedImage(src)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-[4/3] bg-slate-100 rounded flex items-center justify-center text-slate-400 text-sm">No image</div>
          )}
        </div>

        {/* Right column: Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Детали</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab} defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Инфо</TabsTrigger>
                <TabsTrigger value="dims">Габариты</TabsTrigger>
                <TabsTrigger value="statuses">Статусы</TabsTrigger>
                <TabsTrigger value="stocks">Остатки</TabsTrigger>
                <TabsTrigger value="attrs">Характеристики</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Separator />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-slate-500">product_id</div>
                    <div>{info?.id ?? attrs?.id ?? productId}</div>
                    <div className="text-slate-500">offer_id</div>
                    <div>{info?.offer_id ?? attrs?.offer_id ?? "—"}</div>
                    <div className="text-slate-500">sku</div>
                    <div>{info?.sources?.[0]?.sku ?? attrs?.sku ?? "—"}</div>
                    <div className="text-slate-500">currency</div>
                    <div>{info?.currency_code ?? "—"}</div>

                    <div className="text-slate-500">price</div>
                    <div>{info?.price ?? "—"}</div>
                    <div className="text-slate-500">old_price</div>
                    <div>{info?.old_price ?? "—"}</div>
                    <div className="text-slate-500">marketing_price</div>
                    <div>{info?.marketing_price ?? "—"}</div>
                    <div className="text-slate-500">min_price</div>
                    <div>{info?.min_price ?? "—"}</div>

                    <div className="text-slate-500">created_at</div>
                    <div>{info?.created_at ?? "—"}</div>
                    <div className="text-slate-500">updated_at</div>
                    <div>{info?.updated_at ?? "—"}</div>
                  </div>
                )}
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-2">
                  {info?.price ? <Badge>Price</Badge> : null}
                  {info?.old_price ? <Badge variant="secondary">Sale</Badge> : null}
                  {info?.statuses?.is_archived ? <Badge variant="destructive">Archived</Badge> : null}
                </div>
              </TabsContent>

              <TabsContent value="dims">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 text-sm">
                  <div className="text-slate-500">height</div>
                  <div>{attrs?.height ?? "—"} {attrs?.dimension_unit ?? ""}</div>
                  <div className="text-slate-500">width</div>
                  <div>{attrs?.width ?? "—"} {attrs?.dimension_unit ?? ""}</div>
                  <div className="text-slate-500">depth</div>
                  <div>{attrs?.depth ?? "—"} {attrs?.dimension_unit ?? ""}</div>
                  <div className="text-slate-500">weight</div>
                  <div>{attrs?.weight ?? "—"} {attrs?.weight_unit ?? ""}</div>
                </div>
              </TabsContent>

              <TabsContent value="statuses">
                <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">
                  {info?.statuses ? JSON.stringify(info.statuses, null, 2) : "—"}
                </pre>
              </TabsContent>

              <TabsContent value="stocks">
                <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">
                  {info?.stocks ? JSON.stringify(info.stocks, null, 2) : "—"}
                </pre>
              </TabsContent>

              <TabsContent value="attrs">
                {attrs?.attributes?.length ? (
                  <div className="space-y-2 text-sm">
                    {attrs.attributes.map((a: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-[120px_1fr] gap-2">
                        <div className="text-slate-500">id: {a.id}</div>
                        <div>
                          {(a.values || []).map((v: any, i: number) => (
                            <span key={i} className="inline-block bg-slate-100 rounded px-2 py-0.5 mr-2 mb-1">
                              {v.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">—</div>
                )}
              </TabsContent>

              <TabsContent value="raw">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-1">Raw info</div>
                    <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{info ? JSON.stringify(info, null, 2) : "—"}</pre>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Raw attributes</div>
                    <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{attrs ? JSON.stringify(attrs, null, 2) : "—"}</pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
