import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUniGuard } from "@/lib/uniguard/store";
import { FileDown, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; defaultDate?: string; }
const timeLabel = (slot?: { startTime: string; endTime: string }) => slot ? `${slot.startTime} – ${slot.endTime}` : "—";

export function ExportDialog({ open, onOpenChange, defaultDate }: Props) {
  const { schedule, staff, rooms, slots } = useUniGuard();
  const [mode, setMode] = useState<"single" | "full">("single");
  const [date, setDate] = useState<Date>(defaultDate ? new Date(defaultDate) : new Date());
  const [university, setUniversity] = useState("Cairo University");
  const [department, setDepartment] = useState("Faculty of Engineering");
  const [season, setSeason] = useState("Final Exams — Spring 2026");
  const availableDates = useMemo(() => [...new Set(schedule.map((e) => e.date))].sort(), [schedule]);

  const onExport = () => {
    if (schedule.length === 0) { toast.error("Nothing to export — generate a schedule first."); return; }
    const staffMap = new Map(staff.map((s) => [s.id, s]));
    const roomMap = new Map(rooms.map((r) => [r.id, r]));
    const slotMap = new Map(slots.map((s) => [s.id, s]));
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const generatedAt = format(new Date(), "PPp");

    const drawHeader = (subTitle: string) => {
      doc.setFillColor(248, 250, 252); doc.rect(0, 0, pageW, 72, "F");
      doc.setTextColor(31, 64, 135); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(university, 40, 30);
      doc.setTextColor(70, 80, 95); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(`${department} · ${season}`, 40, 50);
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(15, 23, 42); doc.text("Exam Resource Plan", pageW - 40, 32, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(subTitle, pageW - 40, 50, { align: "right" });
    };
    const drawFooter = () => { const h = doc.internal.pageSize.getHeight(); doc.setFontSize(8); doc.setTextColor(120, 120, 120); doc.text(`Generated on ${generatedAt}`, 40, h - 20); doc.text(`Page ${doc.getNumberOfPages()}`, pageW - 40, h - 20, { align: "right" }); };

    const datesToExport = mode === "single" ? [format(date, "yyyy-MM-dd")] : [...new Set(schedule.map((e) => e.date))].sort();
    let firstPage = true;
    for (const d of datesToExport) {
      const entries = schedule.filter((e) => e.date === d).sort((a, b) => a.slotId.localeCompare(b.slotId));
      if (entries.length === 0) continue;
      if (!firstPage) doc.addPage(); firstPage = false;
      drawHeader(`${entries[0].day}, ${d}`);
      const rows = entries.flatMap((e) => e.assignments.map((a) => {
        const slot = slotMap.get(e.slotId); const room = roomMap.get(a.roomId);
        const chief = a.chiefInvigilatorId ? staffMap.get(a.chiefInvigilatorId)?.name ?? "—" : "— UNASSIGNED —";
        const invigilators = a.invigilatorIds.map((id) => id ? staffMap.get(id)?.name ?? "—" : "—").join("\n");
        return [timeLabel(slot), `${slot?.subjectName ?? "—"}\n${slot?.subjectCode ?? ""}`, room?.name ?? "—", chief + (a.sharedChief ? " (Shared)" : ""), invigilators];
      }));
      autoTable(doc, { startY: 92, head: [["Time Range", "Subject (Code)", "Room", "Chief Invigilator", "Invigilators"]], body: rows, theme: "grid", headStyles: { fillColor: [241, 245, 249], textColor: [31, 64, 135], fontStyle: "bold", fontSize: 9 }, bodyStyles: { fontSize: 9, cellPadding: 6 }, alternateRowStyles: { fillColor: [250, 250, 252] }, margin: { left: 40, right: 40 }, columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 150 }, 2: { cellWidth: 90 }, 3: { cellWidth: 180 } } });
      drawFooter();
    }
    const filename = mode === "single" ? `UniGuard_${format(date, "yyyy-MM-dd")}.pdf` : `UniGuard_FullSchedule_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(filename); toast.success("PDF exported", { description: filename }); onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><FileDown className="h-4 w-4" /> Export Schedule PDF</DialogTitle></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><button onClick={() => setMode("single")} className={cn("rounded-lg border p-3 text-left transition-smooth", mode === "single" ? "border-primary bg-primary/5" : "border-border")}><div className="text-sm font-semibold">Single day</div><div className="text-[11px] text-muted-foreground">Printable sheet for the board</div></button><button onClick={() => setMode("full")} className={cn("rounded-lg border p-3 text-left transition-smooth", mode === "full" ? "border-primary bg-primary/5" : "border-border")}><div className="text-sm font-semibold">Full period</div><div className="text-[11px] text-muted-foreground">All days, multi-page report</div></button></div>{mode === "single" && <div><Label>Exam date</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(date, "PPP")}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" /></PopoverContent></Popover>{availableDates.length > 0 && !availableDates.includes(format(date, "yyyy-MM-dd")) && <p className="text-[11px] text-warning mt-1.5">No schedule on this date. Available: {availableDates.join(", ")}</p>}</div>}<div className="grid grid-cols-1 gap-3 pt-2 border-t border-border"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Header information</div><div><Label className="text-xs">University</Label><Input value={university} onChange={(e) => setUniversity(e.target.value)} maxLength={80} /></div><div><Label className="text-xs">Department / Faculty</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={80} /></div><div><Label className="text-xs">Exam season</Label><Input value={season} onChange={(e) => setSeason(e.target.value)} maxLength={80} /></div></div></div><DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={onExport} className="gap-2"><FileDown className="h-4 w-4" /> Export PDF</Button></DialogFooter></DialogContent></Dialog>;
}
