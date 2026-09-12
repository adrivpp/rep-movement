import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  draft: "DRAFT",
  in_progress: "IN PROGRESS",
  ready_to_submit: "READY",
  submitted: "IN REVIEW",
  needs_changes: "NEEDS CHANGES",
  approved: "APPROVED"
};

const tones: Record<string, string> = {
  draft: "bg-[#e8e1d7] text-[#62594f]",
  in_progress: "bg-[#e3dbcf] text-[#37312b]",
  ready_to_submit: "bg-[#ded2c0] text-[#332b22]",
  submitted: "bg-[#d6cdc0] text-[#2d2823]",
  needs_changes: "bg-[#e9dcc9] text-[#684b28]",
  approved: "bg-[#27352f] text-[#f8f1e8]"
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[0.64rem] font-semibold tracking-[0.13em]",
        tones[status] ?? tones.draft,
        className
      )}
    >
      {labels[status] ?? status.toUpperCase()}
    </span>
  );
}
