import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/uniguard/AppLayout";
import { useUniGuard } from "@/lib/uniguard/store";
import { dayOfDate } from "@/lib/uniguard/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/PageState";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Sparkles, RotateCw, Check, FileDown, Save, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScheduleGrid } from "@/components/uniguard/ScheduleGrid";
import { getErrorMessage } from "@/utils/error";
import { toast } from "sonner";
import { ExportDialog } from "@/components/uniguard/ExportDialog";

const slotLabel = (s: { startTime: string; endTime: string }) => `${s.startTime} – ${s.endTime}`;

export default function Scheduler() {
  const { rooms, slots, generate, getEntry, updateSlot, isLoading, error, isPersisting, isEntryDirty, saveEntry } = useUniGuard();
  const [date, setDate] = useState<Date>(new Date());
  const [slotId, setSlotId] = useState("");
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    if (slots.length === 0) {
      setSlotId("");
      return;
    }

    if (!slotId || !slots.some((slot) => slot.id === slotId)) {
      setSlotId(slots[0].id);
    }
  }, [slotId, slots]);

  useEffect(() => {
    setSelectedRooms((previous) => {
      const valid = previous.filter((roomId) => rooms.some((room) => room.id === roomId));

      if (valid.length > 0 || rooms.length === 0) {
        return valid;
      }

      return rooms.slice(0, 5).map((room) => room.id);
    });
  }, [rooms]);

  const dateStr = format(date, "yyyy-MM-dd");
  const activeSlotId = slots.find((candidate) => candidate.id === slotId)?.id ?? slots[0]?.id ?? "";
  const entry = activeSlotId ? getEntry(dateStr, activeSlotId) : undefined;
  const entryDirty = activeSlotId ? isEntryDirty(dateStr, activeSlotId) : false;
  const canSaveEntry = Boolean(activeSlotId && entry && entryDirty && !isPersisting);

  const handleSave = useCallback(async () => {
    if (!activeSlotId || !entry || !entryDirty || isPersisting || saveInFlightRef.current) {
      return false;
    }

    saveInFlightRef.current = true;

    try {
      const saved = await saveEntry(dateStr, activeSlotId);
      if (saved) {
        toast.success("Schedule saved.");
      }

      return saved;
    } finally {
      saveInFlightRef.current = false;
    }
  }, [activeSlotId, dateStr, entry, entryDirty, isPersisting, saveEntry]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "s" || (!event.ctrlKey && !event.metaKey)) {
        return;
      }

      event.preventDefault();

      if (!canSaveEntry) {
        return;
      }

      void handleSave();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canSaveEntry, handleSave]);

  if (isLoading) {
    return (
      <AppLayout title="Flexible Exam Resource Planner" subtitle="Dynamic Chief Invigilator and Invigilator allocation with real-time constraint validation.">
        <LoadingState title="Loading scheduler..." description="Fetching people, rooms, time slots, and saved assignments." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Flexible Exam Resource Planner" subtitle="Dynamic Chief Invigilator and Invigilator allocation with real-time constraint validation.">
        <ErrorState description={getErrorMessage(error)} />
      </AppLayout>
    );
  }

  if (rooms.length === 0 || slots.length === 0) {
    return (
      <AppLayout title="Flexible Exam Resource Planner" subtitle="Dynamic Chief Invigilator and Invigilator allocation with real-time constraint validation.">
        <EmptyState
          title="Scheduler prerequisites missing"
          description={rooms.length === 0 ? "Add at least one room before generating a schedule." : "Add at least one time slot before generating a schedule."}
        />
      </AppLayout>
    );
  }

  const slot = slots.find((s) => s.id === activeSlotId) ?? slots[0];
  const day = dayOfDate(dateStr);

  const toggleRoom = (id: string) => setSelectedRooms((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const onAssign = (partial: boolean) => {
    if (selectedRooms.length === 0) return toast.error("Select at least one room first");
    const { conflicts } = generate({ date: dateStr, slotId: activeSlotId, roomIds: selectedRooms, partial });
    if (conflicts.length === 0) toast.success(partial ? "Schedule regenerated locally" : "Schedule generated locally", { description: `${selectedRooms.length} rooms ready to review and save.` });
    else toast.warning(`${conflicts.length} issues detected`, { description: "Review highlighted rows, then save when ready." });
  };

  return (
    <AppLayout title="Flexible Exam Resource Planner" subtitle="Dynamic Chief Invigilator and Invigilator allocation with real-time constraint validation." actions={<div className="flex flex-wrap gap-2"><Button variant="outline" className="gap-2" onClick={() => setExportOpen(true)}><FileDown className="h-4 w-4" /> Export PDF</Button><Button className="gap-2" disabled={!canSaveEntry} onClick={() => void handleSave()}><Save className="h-4 w-4" />{isPersisting ? "Saving..." : entryDirty ? "Save" : "Saved"}</Button></div>}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StepCard step={1} title="Date & time slot" done={!!date}>
            <div className="space-y-3">
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date ? `${format(date, "PPP")} · ${day}` : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              <div className="grid grid-cols-1 gap-1.5">{slots.map((s) => <button key={s.id} onClick={() => setSlotId(s.id)} className={cn("rounded-md border px-2.5 py-2 text-xs font-medium transition-smooth text-left", activeSlotId === s.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40")}><div>{slotLabel(s)}</div><div className="text-[10px] text-muted-foreground truncate">{s.label ?? "Multi-exam window"}</div></button>)}</div>
              <EditSlotDialog slot={slot} onSave={(patch) => { updateSlot(slot.id, patch); toast.success("Slot metadata updated"); }} />
            </div>
          </StepCard>
          <StepCard step={2} title="Select rooms" done={selectedRooms.length > 0}>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">{rooms.map((r) => { const sel = selectedRooms.includes(r.id); return <button key={r.id} onClick={() => toggleRoom(r.id)} className={cn("rounded-md border px-2.5 py-1.5 text-xs font-medium transition-smooth flex items-center gap-1.5", sel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40")}>{r.name}<span className={cn("text-[10px] opacity-70", sel && "text-primary-foreground/80")}>{r.minInvigilators} inv.</span></button>; })}</div>
            <div className="text-xs text-muted-foreground mt-3">{selectedRooms.length} of {rooms.length} selected</div>
          </StepCard>
          <StepCard step={3} title="Auto-assign" done={!!entry}>
            <div className="space-y-2"><Button onClick={() => onAssign(false)} className="w-full gap-2 shadow-elevated"><Sparkles className="h-4 w-4" /> Generate schedule</Button><Button onClick={() => onAssign(true)} variant="outline" className="w-full gap-2" disabled={!entry}><RotateCw className="h-4 w-4" /> Regenerate unlocked</Button><Button onClick={() => void handleSave()} variant="outline" className="w-full gap-2" disabled={!canSaveEntry}><Save className="h-4 w-4" />{isPersisting ? "Saving..." : entryDirty ? "Save current slot" : "All changes saved"}</Button><p className="text-[11px] text-muted-foreground leading-relaxed">Generate locally, adjust manually, then save the final slot snapshot in one request. Press Ctrl+S or Cmd+S to save the current slot.</p></div>
          </StepCard>
        </div>
        <ScheduleGrid date={dateStr} slotId={activeSlotId} />
      </div>
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} defaultDate={dateStr} />
    </AppLayout>
  );
}

function EditSlotDialog({ slot, onSave }: { slot: any; onSave: (patch: any) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(slot);
  return <Dialog open={open} onOpenChange={(o) => { setOpen(o); setDraft(slot); }}><DialogTrigger asChild><Button variant="outline" size="sm" className="w-full gap-2"><Settings2 className="h-3.5 w-3.5" /> Edit time window</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit time slot</DialogTitle></DialogHeader><p className="text-xs text-muted-foreground">Subjects are now set per room — multiple exams can run in the same time window.</p><div className="grid grid-cols-2 gap-3"><div><Label>Start time</Label><Input value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} /></div><div><Label>End time</Label><Input value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} /></div></div><DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { onSave(draft); setOpen(false); }}>Save</Button></DialogFooter></DialogContent></Dialog>;
}

function StepCard({ step, title, done, children }: { step: number; title: string; done?: boolean; children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card shadow-card p-5"><div className="flex items-center gap-2 mb-3"><div className={cn("h-6 w-6 rounded-full grid place-items-center text-[11px] font-semibold", done ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground")}>{done ? <Check className="h-3 w-3" /> : step}</div><h3 className="text-display font-semibold">{title}</h3>{done && <Badge variant="outline" className="ml-auto text-[10px] border-success/30 text-success">Ready</Badge>}</div>{children}</div>;
}
