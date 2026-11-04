import { notFound } from "next/navigation";
import { parsePairSlug, getRoute } from "@/lib/registry";
import ConverterPageClient from "../_workspace-client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ConvertPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const pair = parsePairSlug(String(slug));
  if (!pair) notFound();
  const route = getRoute(pair.from, pair.to);
  const search = await searchParams;
  return (
    <ConverterPageClient
      from={pair.from}
      to={pair.to}
      initialTo={search.to ?? pair.to}
      route={route}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const pair = parsePairSlug(String(slug));
  if (!pair) return { title: "Invalid conversion" };
  return { title: `Convert ${pair.from} to ${pair.to}` };
}