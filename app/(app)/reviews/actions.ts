"use server";

import { revalidatePath } from "next/cache";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

export async function reviewProduct(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const productId = String(formData.get("productId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!productId || !["approved", "needs_changes"].includes(decision)) {
    return;
  }

  if (decision === "needs_changes" && !comment) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({
      status: decision,
      approved_at: decision === "approved" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("status", "submitted")
    .select("id")
    .single();

  if (updateError) {
    return;
  }

  if (comment) {
    await supabase.from("reviews").insert({
      product_id: productId,
      comment,
      type: decision === "approved" ? "approval" : "changes_requested",
    });
  }

  await supabase.from("audit_logs").insert({
    entity_type: "product",
    entity_id: productId,
    action: decision === "approved" ? "product_approved" : "changes_requested",
    metadata: { comment },
  });

  revalidatePath("/reviews");
  revalidatePath("/dashboard");
  revalidatePath("/products");
}
