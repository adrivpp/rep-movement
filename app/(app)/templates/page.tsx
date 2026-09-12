import { Button } from "@/components/ui/button";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-12">
      <p className="micro-label">TEMPLATES</p>
      <h1 className="mt-4 text-5xl font-medium sm:text-7xl">Field presets</h1>
      <div className="mt-12 divide-y divide-[#ded6ca] border-y border-[#ded6ca]">
        {["Activewear launch", "Footwear product page", "Accessories"].map((name) => (
          <div key={name} className="flex items-center justify-between py-7">
            <div>
              <h2 className="text-2xl font-medium">{name}</h2>
              <p className="mt-1 text-sm text-[#746d64]">Baseline Shopify fields, SEO, care details, and metafields.</p>
            </div>
            <Button variant="secondary">EDIT</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
