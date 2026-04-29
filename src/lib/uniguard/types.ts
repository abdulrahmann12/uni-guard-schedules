export type Day = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export const DAYS: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type Role = "CHIEF_INVIGILATOR" | "INVIGILATOR";

export interface Staff {
  id: string;
  name: string;
  role: Role;
  department: string;
  workingDays: Day[];
  totalAssignments: number;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  minInvigilators: number;
}

export interface Slot {
  id: string;
  label?: string;
  sortOrder?: number;
  date?: string;
  startTime: string;
  endTime: string;
  /** @deprecated Subjects are stored on each Assignment for multi-exam support. Kept as a default suggestion only. */
  subjectName?: string;
  /** @deprecated See subjectName. */
  subjectCode?: string;
}

export interface Assignment {
  roomId: string;
  slotId: string;
  chiefInvigilatorId: string | null;
  invigilatorIds: (string | null)[];
  locked: boolean;
  sharedChief?: boolean;
  subjectName?: string;
  subjectCode?: string;
}

export interface ScheduleEntry {
  date: string;
  slotId: string;
  day: Day;
  assignments: Assignment[];
  lastGeneratedAssignments?: Assignment[];
}

export type AssignmentState = "VALID" | "INCOMPLETE" | "CONFLICT";

export const minInvigilatorsForCapacity = (capacity: number) => (capacity >= 40 ? 2 : 1);
export const roleLabel = (role: Role) => role === "CHIEF_INVIGILATOR" ? "Chief Invigilator" : "Invigilator";
export const roleLabelAr = (role: Role) => role === "CHIEF_INVIGILATOR" ? "رئيس لجنة" : "مراقب";

export const isLargeRoom = (capacity: number) => capacity >= 40;
export const requiredTAs = minInvigilatorsForCapacity;
