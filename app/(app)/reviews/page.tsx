import { StatusBadge } from "@/components/ui/status";

export default function ReviewsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-12">
      <p className="micro-label">REVIEWS</p>
      <h1 className="mt-4 text-5xl font-medium sm:text-7xl">Submitted work</h1>
      <div className="mt-12 divide-y divide-[#ded6ca] border-y border-[#ded6ca]">
        {["Contour Legging", "Studio Bra"].map((name, index) => (
          <div key={name} className="grid gap-4 py-7 md:grid-cols-[1fr_auto_auto] md:items-center">
            <h2 className="text-2xl font-medium">{name}</h2>
            <StatusBadge status={index === 0 ? "submitted" : "needs_changes"} />
            <p className="text-sm text-[#746d64]">{index === 0 ? "Awaiting review" : "Client revisions open"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
