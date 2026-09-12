import { notFound } from "next/navigation";
import { ProductBuilder } from "@/components/product-builder";
import { getProductForEdit } from "@/lib/products";

export default async function EditProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductForEdit(id);

  if (!product) {
    notFound();
  }

  return <ProductBuilder initialData={product} mode="edit" />;
}
