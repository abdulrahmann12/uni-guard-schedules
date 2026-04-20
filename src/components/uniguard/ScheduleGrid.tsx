import { useMemo, useState } from "react";
import { useUniGuard, dayOfDate } from "@/lib/uniguard/store";
import { Lock, Unlock, AlertTriangle, Users, GripVertical, BookOpen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isLargeRoom, requiredTAs } from "@/lib/uniguard/types";
import { StaffPicker } from "./StaffPicker";
import { StaffProfileDialog } from "./StaffProfileDialog";
import { DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface Props {
  date: string;
  slotId: string;
}

export function ScheduleGrid({ date, slotId }: Props) {
  const { getEntry, rooms, staff, slots, manualAssign, toggleLock, swapTAs, setSubject } = useUniGuard();
  const entry = getEntry(date, slotId);
  const slot = slots.find((s) => s.id === slotId);
  const day = dayOfDate(date);
  const [profileId, setProfileId] = useState<string | null>(null);

  const staffMap = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);
  const avgLoad = useMemo(() => staff.reduce((s, p) => s + p.totalAssignments, 0) / Math.max(1, staff.length), [staff]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const from = e.active.id as string;
    const to = e.over?.id as string | undefined;
    if (!to || from === to) return;
    const [fr, fi] = from.split("|");
    const [tr, ti] = to.split("|");
    swapTAs(date, slotId, fr, parseInt(fi), tr, parseInt(ti));
    toast.success("TAs swapped successfully");
  };

  if (!entry) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
        <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-display text-lg font-semibold">No schedule generated yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Pick rooms below and click <span className="font-medium text-foreground">Auto-Assign</span> to build a fair, conflict-free schedule for {slot?.label}.
        </p>
      </div>
    );
  }

  const conflictsCount = entry.assignments.filter((a) => !a.doctorId || a.taIds.some((t, i) => i < requiredTAs(rooms.find(r => r.id === a.roomId)?.capacity ?? 0) && !t)).length;

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <h3 className="text-display font-semibold">{slot?.label}</h3>
            <Badge variant="outline" className="font-mono text-xs">{day}</Badge>
            <Badge variant="outline" className="text-xs">{entry.assignments.length} rooms</Badge>
          </div>
          {conflictsCount > 0 ? (
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15 animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" /> {conflictsCount} conflict{conflictsCount > 1 ? "s" : ""}
            </Badge>
          ) : (
            <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/15">Conflict-free</Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                <th className="px-5 py-3 font-medium">Room</th>
                <th className="px-3 py-3 font-medium">Subject</th>
                <th className="px-3 py-3 font-medium">Doctor</th>
                <th className="px-3 py-3 font-medium">TA #1</th>
                <th className="px-3 py-3 font-medium">TA #2</th>
                <th className="px-3 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entry.assignments.map((a) => {
                const room = rooms.find((r) => r.id === a.roomId);
                if (!room) return null;
                const large = isLargeRoom(room.capacity);
                const needTAs = requiredTAs(room.capacity);
                const doctor = a.doctorId ? staffMap.get(a.doctorId) : null;

                return (
                  <tr key={a.roomId} className={cn("border-t border-border transition-smooth hover:bg-accent/30", a.locked && "bg-warning/5")}>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{room.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground">Cap. {room.capacity}</span>
                          <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 h-4", large && "border-primary/30 text-primary bg-primary/5")}>
                            {large ? "Large" : "Small"}
                          </Badge>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="px-3 py-3.5 w-44">
                      <div className="relative">
                        <BookOpen className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
                        <Input
                          value={a.subject ?? ""}
                          onChange={(e) => setSubject(date, slotId, a.roomId, e.target.value)}
                          placeholder="Subject..."
                          className="h-8 pl-7 text-xs bg-background/50 border-dashed"
                        />
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="px-3 py-3.5">
                      <DoctorCell
                        doctor={doctor ?? null}
                        shared={!!a.sharedDoctor}
                        avgLoad={avgLoad}
                        onPickerOpen={() => {}}
                        onProfileOpen={() => doctor && setProfileId(doctor.id)}
                        picker={
                          <StaffPicker
                            role="doctor"
                            day={day}
                            staff={staff}
                            slotAssignments={entry.assignments}
                            currentId={a.doctorId}
                            onPick={(id) => manualAssign(date, slotId, a.roomId, "doctor", 0, id)}
                            trigger={
                              <button className={cn(
                                "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-smooth w-full text-left border",
                                doctor ? "bg-doctor-soft hover:bg-doctor-soft/80 border-transparent" : "bg-destructive/5 hover:bg-destructive/10 border-dashed border-destructive/40"
                              )}>
                                <div className={cn("h-7 w-7 rounded-full grid place-items-center text-[11px] font-semibold shrink-0", doctor ? "bg-doctor text-doctor-foreground" : "bg-destructive text-destructive-foreground")}>
                                  {doctor ? initials(doctor.name) : "!"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium truncate">{doctor?.name ?? "Click to assign"}</div>
                                  <div className="flex items-center gap-1">
                                    {a.sharedDoctor && <Badge className="bg-shared-soft text-shared border-shared/20 text-[9px] py-0 px-1 h-3.5">Shared</Badge>}
                                    {doctor && (
                                      <span className={cn("text-[10px]", isOverAssigned(doctor.totalAssignments, avgLoad) ? "text-warning font-semibold" : "text-muted-foreground")}>
                                        {doctor.totalAssignments}× {isOverAssigned(doctor.totalAssignments, avgLoad) && "⚠"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            }
                          />
                        }
                      />
                    </td>

                    {/* TAs */}
                    {[0, 1].map((i) => {
                      const taId = a.taIds[i] ?? null;
                      const ta = taId ? staffMap.get(taId) : null;
                      const required = i < needTAs;
                      if (!required) {
                        return <td key={i} className="px-3 py-3.5"><div className="text-xs text-muted-foreground/60 italic">— not required —</div></td>;
                      }
                      return (
                        <td key={i} className="px-3 py-3.5">
                          <DroppableTA roomId={a.roomId} idx={i}>
                            <StaffPicker
                              role="ta"
                              day={day}
                              staff={staff}
                              slotAssignments={entry.assignments}
                              currentId={taId}
                              onPick={(id) => manualAssign(date, slotId, a.roomId, "ta", i, id)}
                              trigger={
                                <DraggableTA roomId={a.roomId} idx={i} disabled={!ta}>
                                  <div className={cn(
                                    "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-smooth w-full text-left cursor-pointer border",
                                    ta ? "bg-ta-soft hover:bg-ta-soft/80 border-transparent" : "bg-destructive/5 hover:bg-destructive/10 border-dashed border-destructive/40"
                                  )}>
                                    {ta && <GripVertical className="h-3.5 w-3.5 text-ta/50 -ml-0.5 shrink-0" />}
                                    <div className={cn("h-7 w-7 rounded-full grid place-items-center text-[11px] font-semibold shrink-0", ta ? "bg-ta text-ta-foreground" : "bg-destructive text-destructive-foreground")}>
                                      {ta ? initials(ta.name) : "!"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-medium truncate">{ta?.name ?? "Click to assign"}</div>
                                      {ta && (
                                        <span className={cn("text-[10px]", isOverAssigned(ta.totalAssignments, avgLoad) ? "text-warning font-semibold" : "text-muted-foreground")}>
                                          {ta.totalAssignments}× {isOverAssigned(ta.totalAssignments, avgLoad) && "⚠"}
                                        </span>
                                      )}
                                    </div>
                                    {ta && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setProfileId(ta.id); }}
                                        className="text-[10px] text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-smooth shrink-0"
                                        title="View profile"
                                      >
                                        ⓘ
                                      </button>
                                    )}
                                  </div>
                                </DraggableTA>
                              }
                            />
                          </DroppableTA>
                        </td>
                      );
                    })}

                    <td className="px-3 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {(a.doctorId || a.taIds.some(Boolean)) && (
                          <button
                            onClick={() => {
                              manualAssign(date, slotId, a.roomId, "doctor", 0, null);
                              a.taIds.forEach((_, i) => manualAssign(date, slotId, a.roomId, "ta", i, null));
                              toast.success(`${room.name} cleared`);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-smooth"
                            title="Clear all assignments in this row"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleLock(date, slotId, a.roomId)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-smooth",
                            a.locked ? "bg-warning/15 text-warning hover:bg-warning/25" : "bg-muted text-muted-foreground hover:bg-muted/70"
                          )}
                          title={a.locked ? "Unlock to allow regeneration" : "Lock to preserve on regenerate"}
                        >
                          {a.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          {a.locked ? "Locked" : "Open"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <StaffProfileDialog staffId={profileId} open={!!profileId} onOpenChange={(o) => !o && setProfileId(null)} />
    </DndContext>
  );
}

function DoctorCell({ picker }: { doctor: any; shared: boolean; avgLoad: number; onPickerOpen: () => void; onProfileOpen: () => void; picker: React.ReactNode }) {
  return <>{picker}</>;
}

function DraggableTA({ roomId, idx, disabled, children }: { roomId: string; idx: number; disabled?: boolean; children: React.ReactNode }) {
  const id = `${roomId}|${idx}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled });
  return <div ref={setNodeRef} {...attributes} {...listeners} className={cn(isDragging && "opacity-40")}>{children}</div>;
}

function DroppableTA({ roomId, idx, children }: { roomId: string; idx: number; children: React.ReactNode }) {
  const id = `${roomId}|${idx}`;
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={cn("rounded-lg transition-smooth", isOver && "ring-2 ring-primary ring-offset-2 ring-offset-card")}>{children}</div>;
}

function initials(name: string) {
  return name.replace(/^Dr\.\s*/, "").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function isOverAssigned(count: number, avg: number) {
  return count > Math.max(2, Math.ceil(avg * 1.5));
}
