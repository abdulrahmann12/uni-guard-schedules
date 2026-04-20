import { useState } from "react";
import { AppLayout } from "@/components/uniguard/AppLayout";
import { useUniGuard, dayOfDate } from "@/lib/uniguard/store";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles, RotateCw, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScheduleGrid } from "@/components/uniguard/ScheduleGrid";
import { toast } from "sonner";

export default function Scheduler() {
  const { rooms, slots, generate, getEntry } = useUniGuard();
  const [date, setDate] = useState<Date>(new Date());
  const [slotId, setSlotId] = useState(slots[0].id);
  const [selectedRooms, setSelectedRooms] = useState<string[]>(rooms.slice(0, 5).map(r => r.id));

  const dateStr = format(date, "yyyy-MM-dd");
  const day = dayOfDate(dateStr);
  const entry = getEntry(dateStr, slotId);

  const toggleRoom = (id: string) =>
    setSelectedRooms((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const onAssign = (partial: boolean) => {
    if (selectedRooms.length === 0) {
      toast.error("Select at least one room first");
      return;
    }
    const { conflicts } = generate({ date: dateStr, slotId, roomIds: selectedRooms, partial });
    if (conflicts.length === 0) {
      toast.success(partial ? "Schedule regenerated" : "Schedule generated successfully", { description: `${selectedRooms.length} rooms · conflict-free` });
    } else {
      toast.warning(`${conflicts.length} conflicts detected`, { description: "Review the highlighted cells in the grid." });
    }
  };

  return (
    <AppLayout
      title="Smart Scheduler"
      subtitle="Three-step generation with fairness optimization and locked manual overrides."
    >
      <div className="space-y-6">
        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Step 1 */}
          <StepCard step={1} title="Date & slot" done={!!date}>
            <div className="space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? `${format(date, "PPP")} · ${day}` : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <div className="grid grid-cols-2 gap-1.5">
                {slots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSlotId(s.id)}
                    className={cn(
                      "rounded-md border px-2.5 py-2 text-xs font-medium transition-smooth text-left",
                      slotId === s.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </StepCard>

          {/* Step 2 */}
          <StepCard step={2} title="Select rooms" done={selectedRooms.length > 0}>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {rooms.map((r) => {
                const sel = selectedRooms.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleRoom(r.id)}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-smooth flex items-center gap-1.5",
                      sel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"
                    )}
                  >
                    {r.name}
                    <span className={cn("text-[10px] opacity-70", sel && "text-primary-foreground/80")}>{r.capacity}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground mt-3">{selectedRooms.length} of {rooms.length} selected</div>
          </StepCard>

          {/* Step 3 */}
          <StepCard step={3} title="Auto-assign" done={!!entry}>
            <div className="space-y-2">
              <Button onClick={() => onAssign(false)} className="w-full gap-2 shadow-elevated">
                <Sparkles className="h-4 w-4" /> Generate schedule
              </Button>
              <Button onClick={() => onAssign(true)} variant="outline" className="w-full gap-2" disabled={!entry}>
                <RotateCw className="h-4 w-4" /> Regenerate (preserve locked)
              </Button>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Engine respects working days, role limits (Doctor ≤2, TA = 1), capacity rules, and minimizes assignment variance.
              </p>
            </div>
          </StepCard>
        </div>

        <ScheduleGrid date={dateStr} slotId={slotId} />
      </div>
    </AppLayout>
  );
}

function StepCard({ step, title, done, children }: { step: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("h-6 w-6 rounded-full grid place-items-center text-[11px] font-semibold", done ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground")}>
          {done ? <Check className="h-3 w-3" /> : step}
        </div>
        <h3 className="text-display font-semibold">{title}</h3>
        {done && <Badge variant="outline" className="ml-auto text-[10px] border-success/30 text-success">Ready</Badge>}
      </div>
      {children}
    </div>
  );
}
