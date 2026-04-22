import { useState } from "react";
import { AppLayout } from "@/components/uniguard/AppLayout";
import { useUniGuard, dayOfDate } from "@/lib/uniguard/store";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Sparkles, RotateCw, Check, FileDown, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScheduleGrid } from "@/components/uniguard/ScheduleGrid";
import { toast } from "sonner";
import { ExportDialog } from "@/components/uniguard/ExportDialog";

const slotLabel = (s: { startTime: string; endTime: string; subjectName: string; subjectCode: string }) => `${s.startTime} – ${s.endTime} · ${s.subjectCode}`;

export default function Scheduler() {
  const { rooms, slots, generate, getEntry, updateSlot } = useUniGuard();
  const [date, setDate] = useState<Date>(new Date());
  const [slotId, setSlotId] = useState(slots[0].id);
  const [selectedRooms, setSelectedRooms] = useState<string[]>(rooms.slice(0, 5).map(r => r.id));
  const [exportOpen, setExportOpen] = useState(false);
  const slot = slots.find((s) => s.id === slotId) ?? slots[0];
  const dateStr = format(date, "yyyy-MM-dd");
  const day = dayOfDate(dateStr);
  const entry = getEntry(dateStr, slotId);

  const toggleRoom = (id: string) => setSelectedRooms((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const onAssign = (partial: boolean) => {
    if (selectedRooms.length === 0) return toast.error("Select at least one room first");
    const { conflicts } = generate({ date: dateStr, slotId, roomIds: selectedRooms, partial });
    if (conflicts.length === 0) toast.success(partial ? "Schedule regenerated" : "Schedule generated successfully", { description: `${selectedRooms.length} rooms · valid` });
    else toast.warning(`${conflicts.length} issues detected`, { description: "Review highlighted rows in the planner." });
  };

  return (
    <AppLayout title="Flexible Exam Resource Planner" subtitle="Dynamic Chief Invigilator and Invigilator allocation with real-time constraint validation." actions={<Button variant="outline" className="gap-2" onClick={() => setExportOpen(true)}><FileDown className="h-4 w-4" /> Export PDF</Button>}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StepCard step={1} title="Date & time slot" done={!!date}>
            <div className="space-y-3">
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date ? `${format(date, "PPP")} · ${day}` : "Pick a date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" /></PopoverContent></Popover>
              <div className="grid grid-cols-1 gap-1.5">{slots.map((s) => <button key={s.id} onClick={() => setSlotId(s.id)} className={cn("rounded-md border px-2.5 py-2 text-xs font-medium transition-smooth text-left", slotId === s.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40")}><div>{slotLabel(s)}</div><div className="text-[10px] text-muted-foreground truncate">{s.subjectName}</div></button>)}</div>
              <EditSlotDialog slot={slot} onSave={(patch) => { updateSlot(slot.id, patch); toast.success("Slot metadata updated"); }} />
            </div>
          </StepCard>
          <StepCard step={2} title="Select rooms" done={selectedRooms.length > 0}>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">{rooms.map((r) => { const sel = selectedRooms.includes(r.id); return <button key={r.id} onClick={() => toggleRoom(r.id)} className={cn("rounded-md border px-2.5 py-1.5 text-xs font-medium transition-smooth flex items-center gap-1.5", sel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40")}>{r.name}<span className={cn("text-[10px] opacity-70", sel && "text-primary-foreground/80")}>{r.minInvigilators} inv.</span></button>; })}</div>
            <div className="text-xs text-muted-foreground mt-3">{selectedRooms.length} of {rooms.length} selected</div>
          </StepCard>
          <StepCard step={3} title="Auto-assign" done={!!entry}>
            <div className="space-y-2"><Button onClick={() => onAssign(false)} className="w-full gap-2 shadow-elevated"><Sparkles className="h-4 w-4" /> Generate schedule</Button><Button onClick={() => onAssign(true)} variant="outline" className="w-full gap-2" disabled={!entry}><RotateCw className="h-4 w-4" /> Regenerate unlocked</Button><p className="text-[11px] text-muted-foreground leading-relaxed">Preserves locked rows, validates existing assignments, then fills empty slots by lowest workload.</p></div>
          </StepCard>
        </div>
        <ScheduleGrid date={dateStr} slotId={slotId} />
      </div>
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} defaultDate={dateStr} />
    </AppLayout>
  );
}

function EditSlotDialog({ slot, onSave }: { slot: any; onSave: (patch: any) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(slot);
  return <Dialog open={open} onOpenChange={(o) => { setOpen(o); setDraft(slot); }}><DialogTrigger asChild><Button variant="outline" size="sm" className="w-full gap-2"><Settings2 className="h-3.5 w-3.5" /> Edit Slot</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit time slot metadata</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3"><div><Label>Start time</Label><Input value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} /></div><div><Label>End time</Label><Input value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} /></div><div><Label>Subject name</Label><Input value={draft.subjectName} onChange={(e) => setDraft({ ...draft, subjectName: e.target.value })} /></div><div><Label>Subject code</Label><Input value={draft.subjectCode} onChange={(e) => setDraft({ ...draft, subjectCode: e.target.value })} /></div></div><DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { onSave(draft); setOpen(false); }}>Save</Button></DialogFooter></DialogContent></Dialog>;
}

function StepCard({ step, title, done, children }: { step: number; title: string; done?: boolean; children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card shadow-card p-5"><div className="flex items-center gap-2 mb-3"><div className={cn("h-6 w-6 rounded-full grid place-items-center text-[11px] font-semibold", done ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground")}>{done ? <Check className="h-3 w-3" /> : step}</div><h3 className="text-display font-semibold">{title}</h3>{done && <Badge variant="outline" className="ml-auto text-[10px] border-success/30 text-success">Ready</Badge>}</div>{children}</div>;
}
