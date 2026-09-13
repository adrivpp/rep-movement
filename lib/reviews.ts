import { createClient } from "@/lib/supabase/server";

export type ReviewProduct = {
  id: string;
  title: string;
  status: string;
  completion: number;
  updatedAt: string;
  latestComment: string | null;
};

export async function getReviewProducts(): Promise<ReviewProduct[]> {
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
      "id,title,status,completion_percentage,updated_at,reviews(comment,created_at)",
    )
    .in("status", ["submitted", "needs_changes", "approved"])
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((product) => {
    const comments = [...(product.reviews ?? [])].sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime(),
    );

    return {
      id: product.id,
      title: product.title || "Untitled product",
      status: product.status,
      completion: product.completion_percentage ?? 0,
      updatedAt: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }).format(new Date(product.updated_at)),
      latestComment: comments[0]?.comment ?? null,
    };
  });
}
