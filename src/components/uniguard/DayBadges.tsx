import { Day, DAYS } from "@/lib/uniguard/types";
import { cn } from "@/lib/utils";

interface Props {
  value: Day[];
  onChange?: (days: Day[]) => void;
  size?: "sm" | "md";
  readOnly?: boolean;
}

export function DayBadges({ value, onChange, size = "md", readOnly }: Props) {
  const toggle = (d: Day) => {
    if (readOnly || !onChange) return;
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {DAYS.map((d) => {
        const active = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            disabled={readOnly}
            className={cn(
              "rounded-md font-medium transition-smooth border",
              size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40",
              readOnly && "cursor-default"
            )}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}
