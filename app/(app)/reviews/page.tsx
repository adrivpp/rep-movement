import Link from "next/link";
import { StatusBadge } from "@/components/ui/status";
import { reviewProduct } from "@/app/(app)/reviews/actions";
import { getReviewProducts } from "@/lib/reviews";

export default async function ReviewsPage() {
  const products = await getReviewProducts();

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-12">
      <p className="micro-label">REVIEWS</p>
      <h1 className="mt-4 text-5xl font-medium sm:text-7xl">Submitted work</h1>
      {products.length === 0 ? (
        <div className="mt-12 border-y border-dashed border-[#ded6ca] px-6 py-16 text-center text-sm text-[#746d64]">
          No submitted products yet.
        </div>
      ) : (
        <div className="mt-12 divide-y divide-[#ded6ca] border-y border-[#ded6ca]">
          {products.map((product) => (
            <article key={product.id} className="space-y-5 py-7">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <Link
                    href={`/products/${product.id}`}
                    className="text-2xl font-medium underline-offset-4 hover:underline"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-2 text-sm text-[#746d64]">
                    {product.completion}% complete · Updated {product.updatedAt}
                  </p>
                </div>
                <StatusBadge status={product.status} />
                <p className="text-sm text-[#746d64]">
                  {product.status === "submitted"
                    ? "Awaiting review"
                    : product.status === "approved"
                      ? "Approved"
                      : "Changes requested"}
                </p>
              </div>
              {product.latestComment && (
                <p className="border-l-2 border-[#b58b65] pl-4 text-sm leading-6 text-[#62594f]">
                  {product.latestComment}
                </p>
              )}
              {product.status === "submitted" && (
                <div className="grid gap-4 border-t border-[#eee7db] pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
                  <form action={reviewProduct}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input
                      type="hidden"
                      name="decision"
                      value="needs_changes"
                    />
                    <label className="block">
                      <span className="micro-label">
                        COMMENT REQUIRED FOR CHANGES
                      </span>
                      <textarea
                        className="field mt-2 min-h-20"
                        name="comment"
                        placeholder="What should be updated?"
                        required
                      />
                    </label>
                    <button
                      className="mt-3 border-b border-[#241f1a] pb-1 text-xs font-semibold tracking-[0.14em]"
                      type="submit"
                    >
                      REQUEST CHANGES
                    </button>
                  </form>
                  <form action={reviewProduct}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button
                      className="w-full bg-[#241f1a] px-5 py-3 text-xs font-semibold tracking-[0.14em] text-[#fffdf8]"
                      type="submit"
                    >
                      APPROVE PRODUCT
                    </button>
                  </form>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
