export type Day = "Sun" | "Mon" | "Tue" | "Wed" | "Thu";
export const DAYS: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu"];

export type Role = "doctor" | "ta";

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
}

export interface Slot {
  id: string;
  label: string; // "9:00 - 11:00"
}

export interface Assignment {
  roomId: string;
  doctorId: string | null;
  taIds: (string | null)[]; // length 1 or 2
  locked: boolean;
  sharedDoctor?: boolean; // doctor covers two rooms
  subject?: string; // free-text exam subject
}

export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  slotId: string;
  day: Day;
  assignments: Assignment[];
}

export const isLargeRoom = (capacity: number) => capacity >= 40;
export const requiredTAs = (capacity: number) => (isLargeRoom(capacity) ? 2 : 1);
