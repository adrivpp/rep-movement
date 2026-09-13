import Link from "next/link";
import { notFound } from "next/navigation";
import { DropForm } from "@/components/drop-form";
import { getDropEditorData, getDropProductOptions } from "@/lib/drops";

export default async function DropPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [drop, products] = await Promise.all([
    getDropEditorData(id),
    getDropProductOptions(),
  ]);
  if (!drop) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <Link href="/drops" className="micro-label hover:text-[#241f1a]">
        BACK TO DROPS
      </Link>
      <h1 className="mt-4 text-5xl font-medium sm:text-7xl">{drop.name}</h1>
      <DropForm drop={drop} products={products} />
    </div>
  );
}
