import Link from "next/link";
import { saveDrop } from "@/app/(app)/drops/actions";
import { Button } from "@/components/ui/button";
import type { DropEditorData, DropProductOption } from "@/lib/drops";

export function DropForm({
  drop,
  products,
}: {
  drop?: DropEditorData | null;
  products: DropProductOption[];
}) {
  return (
    <form action={saveDrop} className="mt-10 space-y-10">
      {drop?.id && <input type="hidden" name="id" value={drop.id} />}
      <div className="grid gap-8 md:grid-cols-2">
        <label className="block">
          <span className="micro-label">DROP NAME</span>
          <input
            className="field mt-2"
            name="name"
            defaultValue={drop?.name}
            required
            placeholder="DROP 001"
          />
        </label>
        <label className="block">
          <span className="micro-label">DROP CODE</span>
          <input
            className="field mt-2 uppercase"
            name="code"
            defaultValue={drop?.code}
            required
            placeholder="DROP-001"
          />
        </label>
        <label className="block">
          <span className="micro-label">STATUS</span>
          <select
            className="field mt-2"
            name="status"
            defaultValue={drop?.status ?? "draft"}
          >
            <option value="draft">Draft</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="live">Live</option>
            <option value="ended">Ended</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="block">
          <span className="micro-label">TIMEZONE</span>
          <input
            className="field mt-2"
            name="timezone"
            defaultValue={drop?.timezone ?? "America/New_York"}
          />
        </label>
        <label className="block">
          <span className="micro-label">RELEASE DATE</span>
          <input
            className="field mt-2"
            name="releaseDate"
            type="date"
            defaultValue={drop?.releaseDate}
          />
        </label>
        <label className="block">
          <span className="micro-label">RELEASE TIME</span>
          <input
            className="field mt-2"
            name="releaseTime"
            type="time"
            defaultValue={drop?.releaseTime}
          />
        </label>
      </div>
      <label className="block">
        <span className="micro-label">DESCRIPTION</span>
        <textarea
          className="field mt-2 min-h-32"
          name="description"
          defaultValue={drop?.description}
        />
      </label>
      <fieldset>
        <legend className="micro-label">PRODUCTS IN THIS DROP</legend>
        <div className="mt-4 divide-y divide-[#ded6ca] border-y border-[#ded6ca]">
          {products.length === 0 ? (
            <p className="py-6 text-sm text-[#746d64]">
              Create a product before assigning it to a drop.
            </p>
          ) : (
            products.map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-4 py-4 text-sm"
              >
                <input
                  type="checkbox"
                  name="productIds"
                  value={product.id}
                  defaultChecked={drop?.productIds.includes(product.id)}
                  className="h-4 w-4 accent-[#241f1a]"
                />
                <span>{product.title}</span>
              </label>
            ))
          )}
        </div>
      </fieldset>
      <div className="flex gap-3">
        <Link href="/drops">
          <Button type="button" variant="secondary">
            CANCEL
          </Button>
        </Link>
        <Button type="submit">{drop?.id ? "SAVE DROP" : "CREATE DROP"}</Button>
      </div>
    </form>
  );
}
