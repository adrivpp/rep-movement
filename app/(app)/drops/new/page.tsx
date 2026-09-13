import { DropForm } from "@/components/drop-form";
import { getDropProductOptions } from "@/lib/drops";

export default async function NewDropPage() {
  const products = await getDropProductOptions();
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <p className="micro-label">NEW DROP</p>
      <h1 className="mt-4 text-5xl font-medium sm:text-7xl">Plan a release</h1>
      <DropForm products={products} />
    </div>
  );
}
