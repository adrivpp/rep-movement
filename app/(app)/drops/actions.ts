"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";

const dropStatuses = [
  "draft",
  "coming_soon",
  "live",
  "ended",
  "archived",
] as const;

export async function saveDrop(formData: FormData) {
  if (!hasSupabaseEnv()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const status = String(formData.get("status") ?? "draft");
  const productIds = formData.getAll("productIds").map(String);

  if (
    !name ||
    !code ||
    !dropStatuses.includes(status as (typeof dropStatuses)[number])
  )
    return;

  const values = {
    name,
    code,
    description: String(formData.get("description") ?? "").trim(),
    status,
    release_date: String(formData.get("releaseDate") ?? "") || null,
    release_time: String(formData.get("releaseTime") ?? "") || null,
    timezone: String(formData.get("timezone") ?? "America/New_York"),
    updated_at: new Date().toISOString(),
  };

  const request = id
    ? supabase.from("drops").update(values).eq("id", id).select("id").single()
    : supabase.from("drops").insert(values).select("id").single();
  const { data: drop, error } = await request;
  if (error || !drop) return;

  await supabase.from("drop_products").delete().eq("drop_id", drop.id);
  if (productIds.length) {
    await supabase.from("drop_products").insert(
      productIds.map((productId, position) => ({
        drop_id: drop.id,
        product_id: productId,
        position,
      })),
    );
  }

  await supabase.from("audit_logs").insert({
    entity_type: "drop",
    entity_id: drop.id,
    action: id ? "drop_updated" : "drop_created",
    metadata: { product_count: productIds.length },
  });

  revalidatePath("/drops");
  redirect(`/drops/${drop.id}`);
}
