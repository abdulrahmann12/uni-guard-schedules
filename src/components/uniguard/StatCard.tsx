import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "doctor" | "ta" | "warning";
}

const toneClasses: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-accent text-primary",
  doctor: "bg-doctor-soft text-doctor",
  ta: "bg-ta-soft text-ta",
  warning: "bg-warning/10 text-warning",
};

export function StatCard({ icon: Icon, label, value, hint, tone = "primary" }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-smooth hover:shadow-elevated hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-display text-3xl font-bold mt-2">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
        </div>
        <div className={cn("h-10 w-10 rounded-lg grid place-items-center", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
