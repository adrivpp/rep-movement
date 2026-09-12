import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status";
import { getProductSummaries } from "@/lib/products";

export default async function ProductsPage() {
  const products = await getProductSummaries();

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="flex flex-col justify-between gap-6 border-b border-[#ded6ca] pb-10 md:flex-row md:items-end">
        <div>
          <p className="micro-label">PRODUCTS</p>
          <h1 className="mt-4 text-5xl font-medium sm:text-7xl">
            Catalog intake
          </h1>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            CREATE PRODUCT
          </Button>
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="my-12 rounded-xl border border-dashed border-[#ded6ca] bg-[#fffdf8]/60 px-6 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eee7db] text-[#322b25]">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-2xl font-medium tracking-tight">
            Your catalog is empty
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#746d64]">
            There are no products in your catalog yet. Start by adding your
            first product to manage variants, SKUs, and imagery.
          </p>
          <div className="mt-7">
            <Link href="/products/new">
              <Button>
                <Plus className="h-4 w-4" />
                CREATE FIRST PRODUCT
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-[#ded6ca]">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="grid gap-5 py-7 transition hover:bg-[#eee7db]/40 md:grid-cols-[112px_1fr_160px_160px_120px] md:items-center"
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt=""
                  width={160}
                  height={160}
                  className="aspect-[4/5] w-full rounded-md object-cover md:w-28"
                />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center rounded-md bg-[#e7dfd4] text-[#746d64] md:w-28">
                  <ImagePlus className="h-6 w-6" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-medium">{product.title}</h2>
                <p className="mt-1 text-sm text-[#746d64]">{product.color}</p>
              </div>
              <StatusBadge status={product.status} />
              <div>
                <p className="text-sm">{product.completion}%</p>
                <div className="mt-2 h-1 bg-[#e2dbd0]">
                  <div
                    className="h-full bg-[#2a241f]"
                    style={{ width: `${product.completion}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-[#746d64]">{product.updatedAt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
