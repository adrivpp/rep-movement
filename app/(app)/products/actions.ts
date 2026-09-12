"use server";

import { revalidatePath } from "next/cache";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

type DraftPayload = {
  productId?: string;
  product: {
    title: string;
    vendor: string;
    productType: string;
    handle: string;
    shortDescription: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    tags: string[];
    metafields: Array<{
      namespace: string;
      key: string;
      value: string;
      type: string;
    }>;
  };
  variants: Array<{
    color: string;
    size: string;
    sku: string;
    price: string;
    compareAtPrice: string;
    cost: string;
    stock: string;
    weight: string;
    barcode: string;
  }>;
  images: Array<{
    url: string;
    alt: string;
  }>;
  completion: number;
  status?: "draft" | "in_progress" | "submitted";
};

export async function saveProductDraft(payload: DraftPayload) {
  if (!hasSupabaseEnv()) {
    return { ok: true, mode: "local" as const, message: "Draft saved locally." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Sign in to save this product." };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    return { ok: false, message: "No workspace membership was found for this account." };
  }

  const status = payload.status ?? "in_progress";
  const productValues = {
    organization_id: membership.organization_id,
    title: payload.product.title,
    handle: payload.product.handle,
    vendor: payload.product.vendor,
    product_type: payload.product.productType,
    description: payload.product.description,
    short_description: payload.product.shortDescription,
    seo_title: payload.product.seoTitle,
    seo_description: payload.product.seoDescription,
    completion_percentage: payload.completion,
    status,
    submitted_at: status === "submitted" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };

  const productRequest = payload.productId
    ? supabase
        .from("products")
        .update(productValues)
        .eq("id", payload.productId)
        .select("id")
        .single()
    : supabase
        .from("products")
        .upsert(productValues, { onConflict: "organization_id,handle" })
        .select("id")
        .single();

  const { data: productRow, error: productError } = await productRequest;

  if (productError || !productRow) {
    return { ok: false, message: productError?.message ?? "Could not save product." };
  }

  await Promise.all([
    supabase.from("product_variants").delete().eq("product_id", productRow.id),
    supabase.from("product_tags").delete().eq("product_id", productRow.id),
    supabase.from("product_metafields").delete().eq("product_id", productRow.id),
    supabase.from("product_images").delete().eq("product_id", productRow.id)
  ]);

  const variantRows = payload.variants.map((variant) => ({
    product_id: productRow.id,
    sku: variant.sku,
    price: Number(variant.price || 0),
    compare_at_price: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
    cost: variant.cost ? Number(variant.cost) : null,
    stock: Number.parseInt(variant.stock || "0", 10),
    weight: variant.weight ? Number(variant.weight) : null,
    weight_unit: "kg",
    barcode: variant.barcode,
    color: variant.color,
    size: variant.size,
    option_1_name: "Color",
    option_1_value: variant.color,
    option_2_name: "Size",
    option_2_value: variant.size
  }));

  const imageRows = payload.images
    .filter((image) => !image.url.startsWith("blob:"))
    .map((image, position) => ({
      product_id: productRow.id,
      storage_path: image.url,
      url: image.url,
      alt_text: image.alt,
      position
    }));

  const writes = [];

  if (variantRows.length) {
    writes.push(supabase.from("product_variants").insert(variantRows));
  }

  if (payload.product.tags.length) {
    writes.push(
      supabase.from("product_tags").insert(
        payload.product.tags.map((tag) => ({
          product_id: productRow.id,
          tag
        }))
      )
    );
  }

  if (payload.product.metafields.length) {
    writes.push(
      supabase.from("product_metafields").insert(
        payload.product.metafields
          .filter((field) => field.namespace && field.key)
          .map((field) => ({
            product_id: productRow.id,
            namespace: field.namespace,
            key: field.key,
            value: field.value,
            type: field.type
          }))
      )
    );
  }

  if (imageRows.length) {
    writes.push(supabase.from("product_images").insert(imageRows));
  }

  const results = await Promise.all(writes);
  const failedWrite = results.find((result) => result.error);

  if (failedWrite?.error) {
    return { ok: false, message: failedWrite.error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/products");

  return {
    ok: true,
    mode: "supabase" as const,
    message: status === "submitted" ? "Product submitted for review." : "Product saved."
  };
}
