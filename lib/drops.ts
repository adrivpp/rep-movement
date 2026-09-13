import { createClient } from "@/lib/supabase/server";

export type DropSummary = {
  id: string;
  name: string;
  code: string;
  status: string;
  releaseDate: string | null;
  productCount: number;
};

export type DropEditorData = {
  id?: string;
  name: string;
  code: string;
  description: string;
  status: string;
  releaseDate: string;
  releaseTime: string;
  timezone: string;
  productIds: string[];
};

export type DropProductOption = { id: string; title: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function getDrops(): Promise<DropSummary[]> {
  const supabase = await requireUser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("drops")
    .select("id,name,code,status,release_date,drop_products(id)")
    .order("release_date", { ascending: false });

  if (error || !data) return [];

  return data.map((drop) => ({
    id: drop.id,
    name: drop.name,
    code: drop.code,
    status: drop.status,
    releaseDate: drop.release_date,
    productCount: drop.drop_products?.length ?? 0,
  }));
}

export async function getDropEditorData(
  id: string,
): Promise<DropEditorData | null> {
  const supabase = await requireUser();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("drops")
    .select(
      "id,name,code,description,status,release_date,release_time,timezone,drop_products(product_id)",
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    description: data.description ?? "",
    status: data.status,
    releaseDate: data.release_date ?? "",
    releaseTime: data.release_time?.slice(0, 5) ?? "",
    timezone: data.timezone,
    productIds: (data.drop_products ?? []).map((product) => product.product_id),
  };
}

export async function getDropProductOptions(): Promise<DropProductOption[]> {
  const supabase = await requireUser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id,title")
    .order("title");

  if (error || !data) return [];
  return data.map((product) => ({
    id: product.id,
    title: product.title || "Untitled product",
  }));
}
