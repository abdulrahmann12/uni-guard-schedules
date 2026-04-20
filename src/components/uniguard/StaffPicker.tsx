import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Staff, Day, Assignment } from "@/lib/uniguard/types";
import { Check, X, CircleDot, Clock, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  trigger: React.ReactNode;
  role: "doctor" | "ta";
  day: Day;
  staff: Staff[];
  slotAssignments: Assignment[];
  currentId: string | null;
  onPick: (id: string | null) => void;
}

interface Tiered {
  free: Staff[];
  eligible: Staff[];
  disabled: { staff: Staff; reason: string }[];
}

function tier({ role, day, staff, slotAssignments, currentId }: Omit<Props, "trigger" | "onPick">): Tiered {
  const usedTAs = new Set<string>();
  const doctorRoomCount = new Map<string, number>();
  for (const a of slotAssignments) {
    if (a.doctorId) doctorRoomCount.set(a.doctorId, (doctorRoomCount.get(a.doctorId) ?? 0) + 1);
    a.taIds.forEach((id) => id && usedTAs.add(id));
  }
  const free: Staff[] = [];
  const eligible: Staff[] = [];
  const disabled: { staff: Staff; reason: string }[] = [];

  for (const s of staff) {
    if (s.role !== role) continue;
    if (s.id === currentId) continue;
    const onDay = s.workingDays.includes(day);
    if (!onDay) {
      disabled.push({ staff: s, reason: "Off day" });
      continue;
    }
    if (role === "doctor") {
      const count = doctorRoomCount.get(s.id) ?? 0;
      if (count === 0) free.push(s);
      else if (count === 1) eligible.push(s);
      else disabled.push({ staff: s, reason: "At 2-room limit" });
    } else {
      if (usedTAs.has(s.id)) disabled.push({ staff: s, reason: "Busy in this slot" });
      else free.push(s);
    }
  }
  const sortByLoad = (a: Staff, b: Staff) => a.totalAssignments - b.totalAssignments;
  free.sort(sortByLoad);
  eligible.sort(sortByLoad);
  disabled.sort((a, b) => a.staff.name.localeCompare(b.staff.name));
  return { free, eligible, disabled };
}

export function StaffPicker({ trigger, role, day, staff, slotAssignments, currentId, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const tiers = useMemo(
    () => tier({ role, day, staff, slotAssignments, currentId }),
    [role, day, staff, slotAssignments, currentId]
  );
  const totalAvail = tiers.free.length + tiers.eligible.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${role === "doctor" ? "doctors" : "TAs"}...`} />
          <CommandList className="max-h-80">
            <CommandEmpty>No staff matches your search.</CommandEmpty>
            {tiers.free.length > 0 && (
              <CommandGroup heading={
                <span className="flex items-center gap-1.5 text-success">
                  <CircleDot className="h-3 w-3" /> Free now ({tiers.free.length})
                </span> as any
              }>
                {tiers.free.slice(0, 25).map((s) => (
                  <Item key={s.id} s={s} tone="free" current={currentId === s.id} onPick={() => { onPick(s.id); setOpen(false); }} />
                ))}
              </CommandGroup>
            )}
            {tiers.eligible.length > 0 && (
              <CommandGroup heading={
                <span className="flex items-center gap-1.5 text-warning">
                  <Clock className="h-3 w-3" /> Eligible — already in 1 room ({tiers.eligible.length})
                </span> as any
              }>
                {tiers.eligible.slice(0, 15).map((s) => (
                  <Item key={s.id} s={s} tone="eligible" current={currentId === s.id} onPick={() => { onPick(s.id); setOpen(false); }} />
                ))}
              </CommandGroup>
            )}
            {tiers.disabled.length > 0 && (
              <CommandGroup heading={
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Ban className="h-3 w-3" /> Unavailable ({tiers.disabled.length})
                </span> as any
              }>
                {tiers.disabled.slice(0, 20).map(({ staff: s, reason }) => (
                  <CommandItem key={s.id} value={`__disabled_${s.name}`} disabled className="opacity-50 cursor-not-allowed flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">{reason}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{s.totalAssignments}×</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {currentId && (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  onSelect={() => { onPick(null); setOpen(false); }}
                  className="text-destructive"
                >
                  <X className="mr-2 h-3.5 w-3.5" /> Clear assignment
                </CommandItem>
              </CommandGroup>
            )}
            {totalAvail === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                No available {role === "doctor" ? "doctors" : "TAs"} match the constraints for this slot.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function Item({ s, tone, current, onPick }: { s: Staff; tone: "free" | "eligible"; current: boolean; onPick: () => void }) {
  const dot = tone === "free" ? "bg-success" : "bg-warning";
  return (
    <CommandItem value={s.name} onSelect={onPick} className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">{s.name}</span>
          <span className="text-[10px] text-muted-foreground truncate">{s.department}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.totalAssignments}×</span>
        {current && <Check className="h-3.5 w-3.5 text-primary" />}
      </div>
    </CommandItem>
  );
}
