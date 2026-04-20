import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";
import { Assignment, Day, DAYS, Room, ScheduleEntry, Staff } from "./types";
import { seedRooms, seedStaff, SLOTS } from "./mockData";
import { generateSchedule } from "./engine";

interface Ctx {
  staff: Staff[];
  rooms: Room[];
  slots: typeof SLOTS;
  schedule: ScheduleEntry[];
  setStaffWorkingDays: (id: string, days: Day[]) => void;
  addStaff: (s: Omit<Staff, "id" | "totalAssignments">) => void;
  removeStaff: (id: string) => void;
  addRoom: (r: Omit<Room, "id">) => void;
  removeRoom: (id: string) => void;
  generate: (opts: { date: string; slotId: string; roomIds: string[]; partial?: boolean }) => { conflicts: string[] };
  toggleLock: (date: string, slotId: string, roomId: string) => void;
  manualAssign: (date: string, slotId: string, roomId: string, kind: "doctor" | "ta", index: number, staffId: string | null) => void;
  swapTAs: (date: string, slotId: string, fromRoomId: string, fromIdx: number, toRoomId: string, toIdx: number) => void;
  setSubject: (date: string, slotId: string, roomId: string, subject: string) => void;
  getEntry: (date: string, slotId: string) => ScheduleEntry | undefined;
}

const Ctx = createContext<Ctx | null>(null);

export function dayOfDate(date: string): Day {
  const d = new Date(date);
  const map: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri" as any, "Sat" as any];
  const day = map[d.getDay()];
  return (DAYS.includes(day as Day) ? day : "Sun") as Day;
}

export function UniGuardProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff[]>(() => seedStaff());
  const [rooms, setRooms] = useState<Room[]>(() => seedRooms());
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  const getEntry = useCallback(
    (date: string, slotId: string) => schedule.find((e) => e.date === date && e.slotId === slotId),
    [schedule]
  );

  const recomputeStaffCounts = useCallback((entries: ScheduleEntry[]) => {
    setStaff((prev) => {
      const counts = new Map<string, number>();
      for (const e of entries) {
        for (const a of e.assignments) {
          if (a.doctorId) counts.set(a.doctorId, (counts.get(a.doctorId) ?? 0) + 1);
          a.taIds.forEach((id) => id && counts.set(id, (counts.get(id) ?? 0) + 1));
        }
      }
      return prev.map((s) => ({ ...s, totalAssignments: counts.get(s.id) ?? 0 }));
    });
  }, []);

  const generate: Ctx["generate"] = ({ date, slotId, roomIds, partial }) => {
    const day = dayOfDate(date);
    const existing = partial ? getEntry(date, slotId)?.assignments ?? [] : [];
    const { assignments, conflicts } = generateSchedule({ roomIds, rooms, staff, day, existing });
    setSchedule((prev) => {
      const filtered = prev.filter((e) => !(e.date === date && e.slotId === slotId));
      const next = [...filtered, { date, slotId, day, assignments }];
      recomputeStaffCounts(next);
      return next;
    });
    return { conflicts };
  };

  const toggleLock: Ctx["toggleLock"] = (date, slotId, roomId) => {
    setSchedule((prev) =>
      prev.map((e) =>
        e.date === date && e.slotId === slotId
          ? { ...e, assignments: e.assignments.map((a) => (a.roomId === roomId ? { ...a, locked: !a.locked } : a)) }
          : e
      )
    );
  };

  const updateSharedFlags = (assignments: Assignment[]): Assignment[] => {
    const counts = new Map<string, number>();
    for (const a of assignments) if (a.doctorId) counts.set(a.doctorId, (counts.get(a.doctorId) ?? 0) + 1);
    return assignments.map((a) => ({ ...a, sharedDoctor: !!(a.doctorId && (counts.get(a.doctorId) ?? 0) >= 2) }));
  };

  const manualAssign: Ctx["manualAssign"] = (date, slotId, roomId, kind, index, staffId) => {
    setSchedule((prev) => {
      const next = prev.map((e) => {
        if (e.date !== date || e.slotId !== slotId) return e;
        const assignments = e.assignments.map((a) => {
          if (a.roomId !== roomId) return a;
          if (kind === "doctor") return { ...a, doctorId: staffId };
          const taIds = [...a.taIds];
          taIds[index] = staffId;
          return { ...a, taIds };
        });
        return { ...e, assignments: updateSharedFlags(assignments) };
      });
      recomputeStaffCounts(next);
      return next;
    });
  };

  const swapTAs: Ctx["swapTAs"] = (date, slotId, fromRoomId, fromIdx, toRoomId, toIdx) => {
    setSchedule((prev) =>
      prev.map((e) => {
        if (e.date !== date || e.slotId !== slotId) return e;
        const assignments = e.assignments.map((a) => ({ ...a, taIds: [...a.taIds] }));
        const from = assignments.find((a) => a.roomId === fromRoomId);
        const to = assignments.find((a) => a.roomId === toRoomId);
        if (!from || !to) return e;
        const tmp = from.taIds[fromIdx];
        from.taIds[fromIdx] = to.taIds[toIdx];
        to.taIds[toIdx] = tmp;
        return { ...e, assignments };
      })
    );
  };

  const setStaffWorkingDays: Ctx["setStaffWorkingDays"] = (id, days) =>
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, workingDays: days } : s)));

  const addStaff: Ctx["addStaff"] = (s) =>
    setStaff((prev) => [...prev, { ...s, id: `${s.role === "doctor" ? "D" : "T"}${Date.now()}`, totalAssignments: 0 }]);

  const removeStaff: Ctx["removeStaff"] = (id) => setStaff((prev) => prev.filter((s) => s.id !== id));

  const addRoom: Ctx["addRoom"] = (r) => setRooms((prev) => [...prev, { ...r, id: `R${Date.now()}` }]);
  const removeRoom: Ctx["removeRoom"] = (id) => setRooms((prev) => prev.filter((r) => r.id !== id));

  const value = useMemo<Ctx>(
    () => ({
      staff, rooms, slots: SLOTS, schedule,
      setStaffWorkingDays, addStaff, removeStaff, addRoom, removeRoom,
      generate, toggleLock, manualAssign, swapTAs, getEntry,
    }),
    [staff, rooms, schedule, getEntry]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUniGuard() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUniGuard must be used within UniGuardProvider");
  return ctx;
}
