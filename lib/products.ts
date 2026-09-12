import { type ProductBuilderInitialData } from "@/lib/product-builder-data";
import { createClient } from "@/lib/supabase/server";

export type ProductSummary = {
  id: string;
  title: string;
  color: string;
  status: string;
  completion: number;
  updatedAt: string;
  image: string | null;
};

export async function getProductSummaries(): Promise<ProductSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,status,completion_percentage,updated_at,product_variants(color,size),product_images(url,position)",
    )
    .order("updated_at", { ascending: false })
    .limit(25);

  if (error || !data) {
    return [];
  }

  return data.map((product) => {
    const variants = product.product_variants ?? [];
    const colors = Array.from(
      new Set(variants.map((variant) => variant.color).filter(Boolean)),
    );
    const sizes = Array.from(
      new Set(variants.map((variant) => variant.size).filter(Boolean)),
    );
    const images = [...(product.product_images ?? [])].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );

    return {
      id: product.id,
      title: product.title || "Untitled product",
      color: `${colors.join(", ") || "No color"} / ${sizes.join("-") || "No sizes"}`,
      status: product.status,
      completion: product.completion_percentage ?? 0,
      updatedAt: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }).format(new Date(product.updated_at)),
      image: images[0]?.url ?? null,
    };
  });
}

export async function getProductForEdit(
  id: string,
): Promise<ProductBuilderInitialData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,title,handle,vendor,product_type,description,short_description,seo_title,seo_description,product_variants(id,sku,price,compare_at_price,cost,stock,weight,barcode,color,size),product_images(id,url,alt_text,position),product_tags(tag),product_metafields(namespace,key,value,type)",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const variants = data.product_variants ?? [];
  const colors = Array.from(
    new Set(variants.map((variant) => variant.color).filter(Boolean)),
  );
  const sizes = Array.from(
    new Set(variants.map((variant) => variant.size).filter(Boolean)),
  );

  return {
    id: data.id,
    product: {
      title: data.title ?? "",
      vendor: data.vendor ?? "",
      productType: data.product_type ?? "",
      handle: data.handle ?? "",
      shortDescription: data.short_description ?? "",
      description: data.description ?? "",
      seoTitle: data.seo_title ?? "",
      seoDescription: data.seo_description ?? "",
      colors,
      sizes,
      skuPrefix: variants[0]?.sku?.split("-").slice(0, -2).join("-") ?? "",
      tags: (data.product_tags ?? []).map((tag) => tag.tag),
      metafields: (data.product_metafields ?? []).map((field) => ({
        namespace: field.namespace,
        key: field.key,
        value: field.value,
        type: field.type,
      })),
    },
    variants: variants.map((variant) => ({
      id: variant.id,
      color: variant.color ?? "",
      size: variant.size ?? "",
      sku: variant.sku ?? "",
      price: String(variant.price ?? ""),
      compareAtPrice: String(variant.compare_at_price ?? ""),
      cost: String(variant.cost ?? ""),
      stock: String(variant.stock ?? "0"),
      weight: String(variant.weight ?? ""),
      barcode: variant.barcode ?? "",
    })),
    images: [...(data.product_images ?? [])]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((image) => ({
        id: image.id,
        url: image.url,
        name: image.url.split("/").at(-1) ?? "Product image",
        alt: image.alt_text ?? "",
      })),
  };
}
