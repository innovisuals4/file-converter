import ConverterPageClient from "./_workspace-client";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ConverterPage({ searchParams }: PageProps) {
  const { from, to } = await searchParams;
  return <ConverterPageClient from={from ?? ""} to={to ?? ""} initialTo={to ?? undefined} />;
}
