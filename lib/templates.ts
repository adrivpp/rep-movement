import { createClient } from "@/lib/supabase/server";

export type TemplateSummary = {
  id: string;
  name: string;
  description: string;
  fields: Array<{ label: string; required: boolean; position: number }>;
};

export async function getTemplates(): Promise<TemplateSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("templates")
    .select(
      "id,name,description,template_fields(field_label,required,position)",
    )
    .order("name");

  if (error || !data) return [];

  return data.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description ?? "",
    fields: [...(template.template_fields ?? [])]
      .sort((first, second) => first.position - second.position)
      .map((field) => ({
        label: field.field_label,
        required: field.required,
        position: field.position,
      })),
  }));
}
