import { Day, Room, Slot, Staff } from "./types";

const allDays: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu"];

const pick = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

const docNames = [
  "Dr. Amir Hassan", "Dr. Layla Mansour", "Dr. Omar Khalil", "Dr. Nadia Saleh",
  "Dr. Yusuf Rahman", "Dr. Mariam Farouk", "Dr. Karim Adel", "Dr. Hala Ibrahim",
  "Dr. Tarek Nour", "Dr. Salma Hosny",
];

const taNames = [
  "Ahmed Sami", "Mona Adel", "Hossam Ali", "Reem Tarek", "Khaled Wael",
  "Yara Magdy", "Mostafa Sherif", "Dina Ezzat", "Ziad Hany", "Farah Nabil",
  "Bassel Hisham", "Nour Galal", "Adham Ramy", "Habiba Shawky", "Seif Maged",
  "Malak Ashraf", "Karim Saad", "Aya Mohsen", "Omar Talaat", "Lina Sabry",
];

const departments = ["Computer Science", "Engineering", "Mathematics", "Physics", "Business"];

export const seedStaff = (): Staff[] => {
  // deterministic seed days for variety but mostly available
  const docs: Staff[] = docNames.map((name, i) => ({
    id: `D${i + 1}`,
    name,
    role: "doctor",
    department: departments[i % departments.length],
    workingDays: i % 4 === 0 ? ["Sun", "Mon", "Wed"] : i % 3 === 0 ? ["Mon", "Tue", "Thu"] : allDays,
    totalAssignments: 0,
  }));
  const tas: Staff[] = taNames.map((name, i) => ({
    id: `T${i + 1}`,
    name,
    role: "ta",
    department: departments[i % departments.length],
    workingDays:
      i % 5 === 0 ? ["Sun", "Tue", "Thu"] :
      i % 4 === 0 ? ["Mon", "Wed", "Thu"] :
      i % 3 === 0 ? ["Sun", "Mon", "Tue", "Wed"] :
      allDays,
    totalAssignments: 0,
  }));
  return [...docs, ...tas];
};

export const seedRooms = (): Room[] => [
  { id: "R1", name: "Hall A", capacity: 80 },
  { id: "R2", name: "Hall B", capacity: 60 },
  { id: "R3", name: "Hall C", capacity: 45 },
  { id: "R4", name: "Room 101", capacity: 30 },
  { id: "R5", name: "Room 102", capacity: 35 },
  { id: "R6", name: "Room 201", capacity: 25 },
  { id: "R7", name: "Room 202", capacity: 38 },
  { id: "R8", name: "Lab 1", capacity: 20 },
  { id: "R9", name: "Lab 2", capacity: 22 },
  { id: "R10", name: "Auditorium", capacity: 120 },
];

export const SLOTS: Slot[] = [
  { id: "S1", label: "9:00 – 11:00" },
  { id: "S2", label: "11:30 – 13:30" },
  { id: "S3", label: "14:00 – 16:00" },
  { id: "S4", label: "16:30 – 18:30" },
];
