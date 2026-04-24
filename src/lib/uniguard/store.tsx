import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";
import { Assignment, Day, DAYS, Room, ScheduleEntry, Slot, Staff, minInvigilatorsForCapacity } from "./types";
import { seedRooms, seedStaff, SLOTS } from "./mockData";
import { generateSchedule } from "./engine";
import { validateAssignment, validateSlotAssignments } from "./constraintEngine";

interface Ctx {
  staff: Staff[];
  rooms: Room[];
  slots: Slot[];
  schedule: ScheduleEntry[];
  setStaffWorkingDays: (id: string, days: Day[]) => void;
  addStaff: (s: Omit<Staff, "id" | "totalAssignments">) => void;
  removeStaff: (id: string) => void;
  addRoom: (r: Omit<Room, "id" | "minInvigilators"> & { minInvigilators?: number }) => void;
  removeRoom: (id: string) => void;
  updateSlot: (slotId: string, patch: Partial<Omit<Slot, "id">>) => void;
  generate: (opts: { date: string; slotId: string; roomIds: string[]; partial?: boolean }) => { conflicts: string[] };
  toggleLock: (date: string, slotId: string, roomId: string) => void;
  manualAssign: (date: string, slotId: string, roomId: string, kind: "chief" | "invigilator", index: number, staffId: string | null) => { ok: boolean; message?: string };
  addInvigilatorSlot: (date: string, slotId: string, roomId: string) => void;
  removeInvigilatorSlot: (date: string, slotId: string, roomId: string, index: number) => void;
  updateAssignmentSubject: (date: string, slotId: string, roomId: string, patch: { subjectName?: string; subjectCode?: string }) => void;
  addRoomToSlot: (date: string, slotId: string, roomId: string) => void;
  swapInvigilators: (date: string, slotId: string, fromRoomId: string, fromIdx: number, toRoomId: string, toIdx: number) => void;
  undoLastChange: () => boolean;
  resetSlotToGenerated: (date: string, slotId: string) => boolean;
  getEntry: (date: string, slotId: string) => ScheduleEntry | undefined;
  validateEntry: (entry: ScheduleEntry) => ReturnType<typeof validateSlotAssignments>;
  validateOne: (entry: ScheduleEntry, assignment: Assignment) => ReturnType<typeof validateAssignment>;
}

const Ctx = createContext<Ctx | null>(null);

export function dayOfDate(date: string): Day {
  const d = new Date(date);
  const map: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri" as Day, "Sat" as Day];
  const day = map[d.getDay()];
  return (DAYS.includes(day as Day) ? day : "Sun") as Day;
}

const cloneAssignment = (assignment: Assignment): Assignment => ({ ...assignment, invigilatorIds: [...assignment.invigilatorIds] });
const cloneSchedule = (entries: ScheduleEntry[]): ScheduleEntry[] => entries.map((entry) => ({ ...entry, assignments: entry.assignments.map(cloneAssignment), lastGeneratedAssignments: entry.lastGeneratedAssignments?.map(cloneAssignment) }));

export function UniGuardProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff[]>(() => seedStaff());
  const [rooms, setRooms] = useState<Room[]>(() => seedRooms());
  const [slots, setSlots] = useState<Slot[]>(SLOTS);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [history, setHistory] = useState<ScheduleEntry[][]>([]);

  const getEntry = useCallback((date: string, slotId: string) => schedule.find((e) => e.date === date && e.slotId === slotId), [schedule]);

  const pushHistory = useCallback((entries: ScheduleEntry[]) => {
    setHistory((prev) => [...prev.slice(-9), cloneSchedule(entries)]);
  }, []);

  const recomputeStaffCounts = useCallback((entries: ScheduleEntry[]) => {
    setStaff((prev) => {
      const counts = new Map<string, number>();
      for (const e of entries) {
        for (const a of e.assignments) {
          if (a.chiefInvigilatorId) counts.set(a.chiefInvigilatorId, (counts.get(a.chiefInvigilatorId) ?? 0) + 1);
          a.invigilatorIds.forEach((id) => id && counts.set(id, (counts.get(id) ?? 0) + 1));
        }
      }
      return prev.map((s) => ({ ...s, totalAssignments: counts.get(s.id) ?? 0 }));
    });
  }, []);

  const applySchedule = useCallback((updater: (prev: ScheduleEntry[]) => ScheduleEntry[]) => {
    setSchedule((prev) => {
      pushHistory(prev);
      const next = updater(prev);
      recomputeStaffCounts(next);
      return next;
    });
  }, [pushHistory, recomputeStaffCounts]);

  const withSharedFlags = useCallback((assignments: Assignment[]) => {
    const counts = new Map<string, number>();
    assignments.forEach((a) => a.chiefInvigilatorId && counts.set(a.chiefInvigilatorId, (counts.get(a.chiefInvigilatorId) ?? 0) + 1));
    return assignments.map((a) => ({ ...a, sharedChief: !!(a.chiefInvigilatorId && (counts.get(a.chiefInvigilatorId) ?? 0) >= 2) }));
  }, []);

  const generate: Ctx["generate"] = ({ date, slotId, roomIds, partial }) => {
    const day = dayOfDate(date);
    const existing = partial ? getEntry(date, slotId)?.assignments ?? [] : [];
    const slot = slots.find((s) => s.id === slotId);
    const { assignments, conflicts } = generateSchedule({ roomIds, rooms, staff, day, slotId, existing, defaultSubject: { subjectName: slot?.subjectName, subjectCode: slot?.subjectCode } });
    applySchedule((prev) => {
      const filtered = prev.filter((e) => !(e.date === date && e.slotId === slotId));
      const generated = assignments.map(cloneAssignment);
      return [...filtered, { date, slotId, day, assignments, lastGeneratedAssignments: generated }];
    });
    return { conflicts };
  };

  const toggleLock: Ctx["toggleLock"] = (date, slotId, roomId) => {
    applySchedule((prev) => prev.map((e) => e.date === date && e.slotId === slotId ? { ...e, assignments: e.assignments.map((a) => a.roomId === roomId ? { ...a, locked: !a.locked } : a) } : e));
  };

  const manualAssign: Ctx["manualAssign"] = (date, slotId, roomId, kind, index, staffId) => {
    const entry = getEntry(date, slotId);
    if (!entry) return { ok: false, message: "Generate this slot before assigning staff." };
    const candidateAssignments = entry.assignments.map((a) => {
      if (a.roomId !== roomId) return cloneAssignment(a);
      if (kind === "chief") return { ...a, chiefInvigilatorId: staffId };
      const invigilatorIds = [...a.invigilatorIds];
      invigilatorIds[index] = staffId;
      return { ...a, invigilatorIds };
    });
    const validation = validateSlotAssignments({ assignments: candidateAssignments, rooms, staff, day: entry.day });
    const blockingIssue = validation.issues.find((issue) => staffId && issue.staffId === staffId && issue.type !== "capacity");
    if (blockingIssue) return { ok: false, message: blockingIssue.message };
    applySchedule((prev) => prev.map((e) => e.date === date && e.slotId === slotId ? { ...e, assignments: withSharedFlags(candidateAssignments) } : e));
    return { ok: true };
  };

  const addInvigilatorSlot: Ctx["addInvigilatorSlot"] = (date, slotId, roomId) => {
    applySchedule((prev) => prev.map((e) => e.date === date && e.slotId === slotId ? { ...e, assignments: e.assignments.map((a) => a.roomId === roomId ? { ...a, invigilatorIds: [...a.invigilatorIds, null] } : a) } : e));
  };

  const removeInvigilatorSlot: Ctx["removeInvigilatorSlot"] = (date, slotId, roomId, index) => {
    applySchedule((prev) => prev.map((e) => e.date === date && e.slotId === slotId ? { ...e, assignments: e.assignments.map((a) => a.roomId === roomId ? { ...a, invigilatorIds: a.invigilatorIds.filter((_, i) => i !== index) } : a) } : e));
  };

  const updateAssignmentSubject: Ctx["updateAssignmentSubject"] = (date, slotId, roomId, patch) => {
    applySchedule((prev) => prev.map((e) => e.date === date && e.slotId === slotId ? { ...e, assignments: e.assignments.map((a) => a.roomId === roomId ? { ...a, ...patch } : a) } : e));
  };

  const addRoomToSlot: Ctx["addRoomToSlot"] = (date, slotId, roomId) => {
    const day = dayOfDate(date);
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    applySchedule((prev) => {
      const existing = prev.find((e) => e.date === date && e.slotId === slotId);
      const newAssignment: Assignment = { roomId, slotId, chiefInvigilatorId: null, invigilatorIds: Array.from({ length: room.minInvigilators }, () => null), locked: false };
      if (!existing) return [...prev, { date, slotId, day, assignments: [newAssignment] }];
      if (existing.assignments.some((a) => a.roomId === roomId)) return prev;
      return prev.map((e) => e === existing ? { ...e, assignments: [...e.assignments, newAssignment] } : e);
    });
  };

  const swapInvigilators: Ctx["swapInvigilators"] = (date, slotId, fromRoomId, fromIdx, toRoomId, toIdx) => {
    applySchedule((prev) => prev.map((e) => {
      if (e.date !== date || e.slotId !== slotId) return e;
      const assignments = e.assignments.map(cloneAssignment);
      const from = assignments.find((a) => a.roomId === fromRoomId);
      const to = assignments.find((a) => a.roomId === toRoomId);
      if (!from || !to) return e;
      const tmp = from.invigilatorIds[fromIdx];
      from.invigilatorIds[fromIdx] = to.invigilatorIds[toIdx];
      to.invigilatorIds[toIdx] = tmp;
      return { ...e, assignments };
    }));
  };

  const undoLastChange = () => {
    const last = history[history.length - 1];
    if (!last) return false;
    setHistory((prev) => prev.slice(0, -1));
    setSchedule(cloneSchedule(last));
    recomputeStaffCounts(last);
    return true;
  };

  const resetSlotToGenerated: Ctx["resetSlotToGenerated"] = (date, slotId) => {
    const entry = getEntry(date, slotId);
    if (!entry?.lastGeneratedAssignments) return false;
    applySchedule((prev) => prev.map((e) => e.date === date && e.slotId === slotId ? { ...e, assignments: entry.lastGeneratedAssignments!.map(cloneAssignment) } : e));
    return true;
  };

  const updateSlot: Ctx["updateSlot"] = (slotId, patch) => setSlots((prev) => prev.map((slot) => slot.id === slotId ? { ...slot, ...patch } : slot));
  const validateEntry: Ctx["validateEntry"] = (entry) => validateSlotAssignments({ assignments: entry.assignments, rooms, staff, day: entry.day });
  const validateOne: Ctx["validateOne"] = (entry, assignment) => validateAssignment(assignment, entry.assignments, rooms, staff, entry.day);
  const setStaffWorkingDays: Ctx["setStaffWorkingDays"] = (id, days) => setStaff((prev) => prev.map((s) => s.id === id ? { ...s, workingDays: days } : s));
  const addStaff: Ctx["addStaff"] = (s) => setStaff((prev) => [...prev, { ...s, id: `${s.role === "CHIEF_INVIGILATOR" ? "C" : "I"}${Date.now()}`, totalAssignments: 0 }]);
  const removeStaff: Ctx["removeStaff"] = (id) => setStaff((prev) => prev.filter((s) => s.id !== id));
  const addRoom: Ctx["addRoom"] = (r) => setRooms((prev) => [...prev, { ...r, id: `R${Date.now()}`, minInvigilators: r.minInvigilators ?? minInvigilatorsForCapacity(r.capacity) }]);
  const removeRoom: Ctx["removeRoom"] = (id) => setRooms((prev) => prev.filter((r) => r.id !== id));

  const value = useMemo<Ctx>(() => ({
    staff, rooms, slots, schedule, setStaffWorkingDays, addStaff, removeStaff, addRoom, removeRoom, updateSlot, generate, toggleLock, manualAssign,
    addInvigilatorSlot, removeInvigilatorSlot, updateAssignmentSubject, addRoomToSlot, swapInvigilators, undoLastChange, resetSlotToGenerated, getEntry, validateEntry, validateOne,
  }), [staff, rooms, slots, schedule, getEntry]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUniGuard() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUniGuard must be used within UniGuardProvider");
  return ctx;
}
