import { useMemo, useState } from "react";
import { AppLayout } from "@/components/uniguard/AppLayout";
import { useUniGuard } from "@/lib/uniguard/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, FileDown, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StaffProfileDialog } from "@/components/uniguard/StaffProfileDialog";
import { ExportDialog } from "@/components/uniguard/ExportDialog";

export default function Timeline() {
  const { schedule, staff, rooms, slots } = useUniGuard();
  const [query, setQuery] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const staffMap = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const slotMap = useMemo(() => new Map(slots.map((s) => [s.id, s])), [slots]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byDate = new Map<string, typeof schedule>();
    for (const e of schedule) {
      const filteredAssignments = e.assignments.filter((a) => {
        if (!q) return true;
        const room = roomMap.get(a.roomId);
        if (room?.name.toLowerCase().includes(q)) return true;
        if (a.subject?.toLowerCase().includes(q)) return true;
        if (a.doctorId && staffMap.get(a.doctorId)?.name.toLowerCase().includes(q)) return true;
        if (a.taIds.some((id) => id && staffMap.get(id)?.name.toLowerCase().includes(q))) return true;
        if (e.day.toLowerCase().includes(q) || e.date.includes(q)) return true;
        return false;
      });
      if (filteredAssignments.length === 0) continue;
      const filteredEntry = { ...e, assignments: filteredAssignments };
      const arr = byDate.get(e.date) ?? [];
      arr.push(filteredEntry);
      byDate.set(e.date, arr);
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [schedule, query, staffMap, roomMap]);

  return (
    <AppLayout
      title="Master Timeline"
      subtitle="Every scheduled exam, grouped by day. Search by staff, subject, room, or date."
      actions={
        <Button className="gap-2 shadow-elevated" onClick={() => setExportOpen(true)}>
          <FileDown className="h-4 w-4" /> Export PDF
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by staff, subject, room, or day..."
            className="pl-9 bg-card"
          />
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
            <CalendarRange className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-display text-lg font-semibold">No exams scheduled yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Generate a schedule to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map(([date, entries]) => {
              const totalRooms = entries.reduce((n, e) => n + e.assignments.length, 0);
              return (
                <Collapsible key={date} defaultOpen className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                  <CollapsibleTrigger className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/30 hover:bg-muted/50 transition-smooth group">
                    <div className="flex items-center gap-3">
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                      <span className="font-display font-semibold">{date}</span>
                      <Badge variant="outline" className="font-mono text-xs">{entries[0].day}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{entries.length} slot{entries.length > 1 ? "s" : ""} · {totalRooms} room{totalRooms > 1 ? "s" : ""}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/10 border-t border-border">
                          <th className="px-5 py-2.5 font-medium w-32">Time</th>
                          <th className="px-3 py-2.5 font-medium w-32">Subject</th>
                          <th className="px-3 py-2.5 font-medium w-28">Room</th>
                          <th className="px-3 py-2.5 font-medium">Doctor</th>
                          <th className="px-3 py-2.5 font-medium">TAs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.flatMap((e) =>
                          e.assignments.map((a, i) => {
                            const room = roomMap.get(a.roomId);
                            const slot = slotMap.get(e.slotId);
                            const doctor = a.doctorId ? staffMap.get(a.doctorId) : null;
                            return (
                              <tr key={`${e.slotId}-${a.roomId}`} className={cn("border-t border-border hover:bg-accent/20 transition-smooth", i === 0 && "bg-muted/5")}>
                                <td className="px-5 py-2.5 text-xs font-medium">{slot?.label}</td>
                                <td className="px-3 py-2.5 text-xs">{a.subject || <span className="text-muted-foreground italic">—</span>}</td>
                                <td className="px-3 py-2.5">
                                  <span className="font-semibold text-xs">{room?.name}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  {doctor ? (
                                    <button onClick={() => setProfileId(doctor.id)} className="text-xs font-medium text-doctor hover:underline inline-flex items-center gap-1.5">
                                      <span className="h-1.5 w-1.5 rounded-full bg-doctor" />{doctor.name}
                                      {a.sharedDoctor && <Badge className="bg-shared-soft text-shared border-shared/20 text-[9px] py-0 px-1 h-3.5">Shared</Badge>}
                                    </button>
                                  ) : <span className="text-xs text-destructive italic">Unassigned</span>}
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {a.taIds.map((id, j) => {
                                      const ta = id ? staffMap.get(id) : null;
                                      if (!ta) return <span key={j} className="text-[10px] text-destructive italic">TA #{j + 1} missing</span>;
                                      return (
                                        <button key={j} onClick={() => setProfileId(ta.id)} className="text-xs font-medium text-ta hover:underline inline-flex items-center gap-1.5">
                                          <span className="h-1.5 w-1.5 rounded-full bg-ta" />{ta.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      <StaffProfileDialog staffId={profileId} open={!!profileId} onOpenChange={(o) => !o && setProfileId(null)} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </AppLayout>
  );
}
