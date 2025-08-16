import ClientPage from "./page.client";

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  return <ClientPage id={id} />;
}
