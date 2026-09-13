import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status";
import { getDrops } from "@/lib/drops";

export default async function DropsPage() {
  const drops = await getDrops();

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="flex flex-col justify-between gap-6 border-b border-[#ded6ca] pb-10 md:flex-row md:items-end">
        <div>
          <p className="micro-label">DROPS</p>
          <h1 className="mt-4 text-5xl font-medium sm:text-7xl">
            Release calendar
          </h1>
        </div>
        <Link href="/drops/new">
          <Button>
            <Plus className="h-4 w-4" /> CREATE DROP
          </Button>
        </Link>
      </div>
      {drops.length === 0 ? (
        <div className="my-12 border-y border-dashed border-[#ded6ca] px-6 py-20 text-center text-sm text-[#746d64]">
          No drops yet.
        </div>
      ) : (
        <div className="mt-8 divide-y divide-[#ded6ca] border-y border-[#ded6ca]">
          {drops.map((drop) => (
            <Link
              key={drop.id}
              href={`/drops/${drop.id}`}
              className="grid gap-4 py-7 transition hover:bg-[#eee7db]/40 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
            >
              <div>
                <h2 className="text-2xl font-medium">{drop.name}</h2>
                <p className="mt-1 text-sm text-[#746d64]">{drop.code}</p>
              </div>
              <StatusBadge status={drop.status} />
              <p className="text-sm text-[#746d64]">
                {drop.releaseDate ?? "Date TBD"}
              </p>
              <p className="text-sm text-[#746d64]">
                {drop.productCount} products
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
