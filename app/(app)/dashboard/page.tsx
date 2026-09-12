import Image from "next/image";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status";
import { getProductSummaries } from "@/lib/products";

const statusCount = (
  products: Awaited<ReturnType<typeof getProductSummaries>>,
  status: string,
) => products.filter((product) => product.status === status).length;

export default async function DashboardPage() {
  const products = await getProductSummaries();
  const stats = [
    [String(products.length), "PRODUCTS"],
    [String(statusCount(products, "submitted")), "IN REVIEW"],
    [
      String(
        statusCount(products, "in_progress") + statusCount(products, "draft"),
      ),
      "IN PROGRESS",
    ],
    [String(statusCount(products, "approved")), "APPROVED"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="flex flex-col justify-between gap-8 border-b border-[#ded6ca] pb-10 lg:flex-row lg:items-end">
        <div>
          <p className="micro-label">GOOD MORNING</p>
          <h1 className="mt-4 text-5xl font-medium tracking-normal sm:text-7xl">
            Your product studio
          </h1>
        </div>
        <Link href="/products/new">
          <Button>CREATE PRODUCT</Button>
        </Link>
      </div>

      <section className="grid gap-8 border-b border-[#ded6ca] py-10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label}>
            <div className="text-5xl font-medium">{value}</div>
            <div className="micro-label mt-3">{label}</div>
          </div>
        ))}
      </section>

      <section className="py-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="micro-label">RECENT PRODUCTS</p>
          {products.length > 0 && (
            <Link
              className="text-sm font-medium underline underline-offset-4"
              href="/products"
            >
              View all
            </Link>
          )}
        </div>
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#ded6ca] bg-[#fffdf8]/60 px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eee7db] text-[#322b25]">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No products yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#746d64]">
              Start drafting your first product catalog intake, configure
              variants, and prepare for review.
            </p>
            <div className="mt-6">
              <Link href="/products/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  CREATE PRODUCT
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#ded6ca]">
            {products.slice(0, 6).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="grid gap-5 py-6 transition hover:bg-[#eee7db]/40 sm:grid-cols-[96px_1fr_auto] sm:items-center"
              >
                <Image
                  src={product.image}
                  alt=""
                  width={120}
                  height={120}
                  className="aspect-square w-full rounded-md object-cover sm:w-24"
                />
                <div>
                  <h2 className="text-2xl font-medium">{product.title}</h2>
                  <p className="mt-1 text-sm text-[#746d64]">{product.color}</p>
                  <div className="mt-4">
                    <StatusBadge status={product.status} />
                  </div>
                </div>
                <div className="min-w-44">
                  <div className="flex items-center justify-between text-sm">
                    <span>{product.completion}% complete</span>
                    <span className="text-[#746d64]">{product.updatedAt}</span>
                  </div>
                  <div className="mt-3 h-1 bg-[#e2dbd0]">
                    <div
                      className="h-full bg-[#2a241f]"
                      style={{ width: `${product.completion}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
