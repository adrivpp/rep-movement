"use server";

import { revalidatePath } from "next/cache";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { makeHandle } from "@/lib/utils";
import { getProductCompletion } from "@/lib/product-completion";

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
    specs: {
      fabric: string;
      composition: string;
      fit: string;
      compression: string;
      stretch: string;
      support: string;
      rise: string;
      length: string;
      activity: string;
      modelHeight: string;
      modelSize: string;
      careInstructions: string;
      countryOfOrigin: string;
    };
    colorwayDetails: Record<
      string,
      {
        status:
          | "coming_soon"
          | "available"
          | "low_stock"
          | "sold_out"
          | "preorder"
          | "restocked"
          | "archived";
        isPermanent: boolean;
        isLimited: boolean;
        preorderEnabled: boolean;
        preorderStart: string;
        preorderEnd: string;
        preorderShippingEstimate: string;
        preorderMessage: string;
      }
    >;
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
    return {
      ok: true,
      mode: "local" as const,
      message: "Draft saved locally.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Sign in to save this product." };
  }

  const title = payload.product.title.trim();
  const handle = makeHandle(payload.product.handle || title);
  if (!title || !handle) {
    return { ok: false, message: "Product name and handle are required." };
  }

  const seenSkus = new Set<string>();
  for (const variant of payload.variants) {
    const sku = variant.sku.trim();
    const price = Number(variant.price || 0);
    const stock = Number(variant.stock || 0);
    const weight = variant.weight ? Number(variant.weight) : 0;
    if (!sku || seenSkus.has(sku.toLowerCase())) {
      return { ok: false, message: "Every variant must have a unique SKU." };
    }
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isFinite(weight) ||
      weight < 0
    ) {
      return {
        ok: false,
        message:
          "Prices, stock, and weight must be valid non-negative numbers.",
      };
    }
    seenSkus.add(sku.toLowerCase());
  }

  const completionResult = getProductCompletion({
    title,
    vendor: payload.product.vendor || "REP.MOVEMENT",
    productType: payload.product.productType,
    handle,
    shortDescription: payload.product.shortDescription,
    description: payload.product.description,
    seoTitle: payload.product.seoTitle,
    seoDescription: payload.product.seoDescription,
    specs: payload.product.specs,
    colors: Array.from(
      new Set(payload.variants.map((variant) => variant.color).filter(Boolean)),
    ),
    sizes: Array.from(
      new Set(payload.variants.map((variant) => variant.size).filter(Boolean)),
    ),
    variants: payload.variants,
  });

  if (payload.status === "submitted" && completionResult.missing.length > 0) {
    return {
      ok: false,
      message: `Complete required fields: ${completionResult.missing.join(", ")}.`,
    };
  }

  const status = payload.status ?? "in_progress";
  const productValues = {
    title,
    handle,
    vendor: payload.product.vendor || "REP.MOVEMENT",
    product_type: payload.product.productType,
    description: payload.product.description,
    short_description: payload.product.shortDescription,
    seo_title: payload.product.seoTitle,
    seo_description: payload.product.seoDescription,
    completion_percentage: completionResult.percentage,
    status,
    submitted_at: status === "submitted" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
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
        .upsert(productValues, { onConflict: "handle" })
        .select("id")
        .single();

  const { data: productRow, error: productError } = await productRequest;

  if (productError || !productRow) {
    return {
      ok: false,
      message: productError?.message ?? "Could not save product.",
    };
  }

  await Promise.all([
    supabase.from("product_variants").delete().eq("product_id", productRow.id),
    supabase.from("product_colorways").delete().eq("product_id", productRow.id),
    supabase.from("product_tags").delete().eq("product_id", productRow.id),
    supabase
      .from("product_metafields")
      .delete()
      .eq("product_id", productRow.id),
    supabase.from("product_images").delete().eq("product_id", productRow.id),
  ]);

  const colorNames = Array.from(
    new Set(
      payload.variants.map((variant) => variant.color.trim()).filter(Boolean),
    ),
  );
  const { data: colorways, error: colorwayError } = colorNames.length
    ? await supabase
        .from("product_colorways")
        .insert(
          colorNames.map((color_name_snapshot, position) => {
            const details = payload.product.colorwayDetails[
              color_name_snapshot
            ] ?? {
              status: "available" as const,
              isPermanent: true,
              isLimited: false,
              preorderEnabled: false,
              preorderStart: "",
              preorderEnd: "",
              preorderShippingEstimate: "",
              preorderMessage: "",
            };
            return {
              product_id: productRow.id,
              color_name_snapshot,
              position,
              status: details.status,
              is_permanent: details.isPermanent,
              is_limited: details.isLimited,
              preorder_enabled: details.preorderEnabled,
              preorder_start: details.preorderStart || null,
              preorder_end: details.preorderEnd || null,
              preorder_shipping_estimate:
                details.preorderShippingEstimate || null,
              preorder_message: details.preorderMessage || null,
            };
          }),
        )
        .select("id,color_name_snapshot")
    : { data: [], error: null };

  if (colorwayError) {
    return { ok: false, message: "Could not save product colorways." };
  }

  const colorwayByName = new Map(
    (colorways ?? []).map((colorway) => [
      colorway.color_name_snapshot.toLowerCase(),
      colorway.id,
    ]),
  );

  const variantRows = payload.variants.map((variant) => ({
    product_id: productRow.id,
    colorway_id: colorwayByName.get(variant.color.trim().toLowerCase()) ?? null,
    sku: variant.sku,
    price: Number(variant.price || 0),
    compare_at_price: variant.compareAtPrice
      ? Number(variant.compareAtPrice)
      : null,
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
    option_2_value: variant.size,
  }));

  const imageRows = payload.images
    .filter((image) => !image.url.startsWith("blob:"))
    .map((image, position) => ({
      product_id: productRow.id,
      storage_path: image.url,
      url: image.url,
      alt_text: image.alt,
      position,
    }));

  const writes = [];

  writes.push(
    supabase.from("product_specs").upsert(
      {
        product_id: productRow.id,
        fabric: payload.product.specs.fabric,
        composition: payload.product.specs.composition,
        fit: payload.product.specs.fit,
        compression: payload.product.specs.compression,
        stretch: payload.product.specs.stretch,
        support: payload.product.specs.support,
        rise: payload.product.specs.rise,
        length: payload.product.specs.length,
        activity: payload.product.specs.activity,
        model_height: payload.product.specs.modelHeight,
        model_size: payload.product.specs.modelSize,
        care_instructions: payload.product.specs.careInstructions,
        country_of_origin: payload.product.specs.countryOfOrigin,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" },
    ),
  );

  if (variantRows.length) {
    writes.push(supabase.from("product_variants").insert(variantRows));
  }

  if (payload.product.tags.length) {
    writes.push(
      supabase.from("product_tags").insert(
        payload.product.tags.map((tag) => ({
          product_id: productRow.id,
          tag,
        })),
      ),
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
            type: field.type,
          })),
      ),
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
    message:
      status === "submitted"
        ? "Product submitted for review."
        : "Product saved.",
  };
}
