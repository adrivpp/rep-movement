import { getTemplates } from "@/lib/templates";

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-12">
      <p className="micro-label">TEMPLATES</p>
      <h1 className="mt-4 text-5xl font-medium sm:text-7xl">Field presets</h1>
      {templates.length === 0 ? (
        <div className="mt-12 border-y border-dashed border-[#ded6ca] px-6 py-16 text-center text-sm text-[#746d64]">
          No templates configured.
        </div>
      ) : (
        <div className="mt-12 divide-y divide-[#ded6ca] border-y border-[#ded6ca]">
          {templates.map((template) => (
            <section key={template.id} className="py-7">
              <h2 className="text-2xl font-medium">{template.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#746d64]">
                {template.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {template.fields.map((field) => (
                  <span
                    key={field.label}
                    className="border border-[#d8d0c5] px-3 py-2 text-xs tracking-[0.08em]"
                  >
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
