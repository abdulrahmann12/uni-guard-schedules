import { Assignment, Room, Staff, isLargeRoom, requiredTAs, Day } from "./types";

interface GenerateInput {
  roomIds: string[];
  rooms: Room[];
  staff: Staff[];
  day: Day;
  existing?: Assignment[]; // for partial regeneration (preserve locked)
}

interface GenerateResult {
  assignments: Assignment[];
  staffUpdates: Record<string, number>; // staffId -> totalAssignments delta
  conflicts: string[];
}

// Pure scheduling engine: assigns one slot at a time
export function generateSchedule({ roomIds, rooms, staff, day, existing = [] }: GenerateInput): GenerateResult {
  const roomMap = new Map(rooms.map((r) => [r.id, r]));
  const lockedByRoom = new Map<string, Assignment>();
  for (const a of existing) if (a.locked) lockedByRoom.set(a.roomId, a);

  // Track in-slot usage
  const doctorRoomCount = new Map<string, number>(); // doctorId -> rooms in this slot
  const usedTAs = new Set<string>();
  const delta = new Map<string, number>();

  // Account for locked assignments first
  for (const a of lockedByRoom.values()) {
    if (a.doctorId) doctorRoomCount.set(a.doctorId, (doctorRoomCount.get(a.doctorId) ?? 0) + 1);
    a.taIds.forEach((id) => id && usedTAs.add(id));
  }

  const conflicts: string[] = [];

  const availableDoctors = () =>
    staff
      .filter((s) => s.role === "doctor" && s.workingDays.includes(day))
      .filter((s) => (doctorRoomCount.get(s.id) ?? 0) < 2)
      .sort((a, b) => {
        const ac = (a.totalAssignments + (delta.get(a.id) ?? 0));
        const bc = (b.totalAssignments + (delta.get(b.id) ?? 0));
        if (ac !== bc) return ac - bc;
        // prefer doctors already covering 1 room (shared) to maximize reuse fairness? No — prefer fresh
        return Math.random() - 0.5;
      });

  const availableTAs = () =>
    staff
      .filter((s) => s.role === "ta" && s.workingDays.includes(day) && !usedTAs.has(s.id))
      .sort((a, b) => {
        const ac = (a.totalAssignments + (delta.get(a.id) ?? 0));
        const bc = (b.totalAssignments + (delta.get(b.id) ?? 0));
        if (ac !== bc) return ac - bc;
        return Math.random() - 0.5;
      });

  const assignments: Assignment[] = [];

  for (const roomId of roomIds) {
    const room = roomMap.get(roomId);
    if (!room) continue;
    const locked = lockedByRoom.get(roomId);
    if (locked) {
      assignments.push(locked);
      continue;
    }
    const needTAs = requiredTAs(room.capacity);

    // Pick doctor
    const docPool = availableDoctors();
    const doctor = docPool[0] ?? null;
    let doctorId: string | null = null;
    if (doctor) {
      doctorId = doctor.id;
      doctorRoomCount.set(doctor.id, (doctorRoomCount.get(doctor.id) ?? 0) + 1);
      delta.set(doctor.id, (delta.get(doctor.id) ?? 0) + 1);
    } else {
      conflicts.push(`No available doctor for ${room.name}`);
    }

    // Pick TAs
    const taIds: (string | null)[] = [];
    for (let i = 0; i < needTAs; i++) {
      const taPool = availableTAs();
      const ta = taPool[0] ?? null;
      if (ta) {
        taIds.push(ta.id);
        usedTAs.add(ta.id);
        delta.set(ta.id, (delta.get(ta.id) ?? 0) + 1);
      } else {
        taIds.push(null);
        conflicts.push(`Missing TA #${i + 1} for ${room.name}`);
      }
    }

    assignments.push({ roomId, doctorId, taIds, locked: false });
  }

  // Mark shared doctors
  const sharedDocs = new Set<string>();
  for (const [docId, count] of doctorRoomCount.entries()) if (count >= 2) sharedDocs.add(docId);
  for (const a of assignments) if (a.doctorId && sharedDocs.has(a.doctorId)) a.sharedDoctor = true;

  const staffUpdates: Record<string, number> = {};
  delta.forEach((v, k) => (staffUpdates[k] = v));
  return { assignments, staffUpdates, conflicts };
}

// Best-fit candidates for manual override of one slot
export function bestFitCandidates(opts: {
  role: "doctor" | "ta";
  day: Day;
  staff: Staff[];
  slotAssignments: Assignment[];
  excludeId?: string | null;
}) {
  const { role, day, staff, slotAssignments, excludeId } = opts;
  const usedTAs = new Set<string>();
  const doctorRoomCount = new Map<string, number>();
  for (const a of slotAssignments) {
    if (a.doctorId) doctorRoomCount.set(a.doctorId, (doctorRoomCount.get(a.doctorId) ?? 0) + 1);
    a.taIds.forEach((id) => id && usedTAs.add(id));
  }
  return staff
    .filter((s) => s.role === role && s.workingDays.includes(day))
    .filter((s) => s.id !== excludeId)
    .filter((s) => (role === "doctor" ? (doctorRoomCount.get(s.id) ?? 0) < 2 : !usedTAs.has(s.id)))
    .sort((a, b) => a.totalAssignments - b.totalAssignments);
}
