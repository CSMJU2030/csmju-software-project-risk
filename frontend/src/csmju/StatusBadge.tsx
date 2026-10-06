/** Colour family a status badge renders with (ui-design-system.md §3.1). */
export type StatusTone = "success" | "info" | "warning" | "error" | "neutral";

export const TONE_STYLES: Record<StatusTone, { badge: string; dot: string; label: string }> = {
  success: { badge: "bg-success/10 text-success", dot: "bg-success", label: "เขียว" },
  info: { badge: "bg-primary-container/10 text-primary-container", dot: "bg-primary-container", label: "น้ำเงิน" },
  warning: { badge: "bg-warning/10 text-warning", dot: "bg-warning", label: "ส้ม" },
  error: { badge: "bg-error-container text-on-error-container", dot: "bg-error", label: "แดง" },
  neutral: { badge: "bg-surface-variant text-on-surface-variant", dot: "bg-outline", label: "เทา" },
};

export const TONES = Object.keys(TONE_STYLES) as StatusTone[];

export default function StatusBadge({
  tone = "neutral",
  label = "ไม่ระบุสถานะ",
}: {
  tone?: StatusTone;
  label?: string;
}) {
  const style = TONE_STYLES[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-label-sm ${style.badge}`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}
