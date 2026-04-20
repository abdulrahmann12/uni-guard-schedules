import { useState } from "react";
import { AppLayout } from "@/components/uniguard/AppLayout";
import { useUniGuard } from "@/lib/uniguard/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayBadges } from "@/components/uniguard/DayBadges";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, UserCog, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Day, DAYS } from "@/lib/uniguard/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function People() {
  const { staff, setStaffWorkingDays, addStaff, removeStaff } = useUniGuard();
  const doctors = staff.filter((s) => s.role === "doctor");
  const tas = staff.filter((s) => s.role === "ta");

  return (
    <AppLayout title="People" subtitle="Manage doctors and teaching assistants, their availability and workload.">
      <Tabs defaultValue="doctors" className="space-y-5">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="doctors" className="gap-2"><UserCog className="h-4 w-4" /> Doctors <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-doctor-soft text-doctor">{doctors.length}</span></TabsTrigger>
            <TabsTrigger value="tas" className="gap-2"><Users className="h-4 w-4" /> TAs <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-ta-soft text-ta">{tas.length}</span></TabsTrigger>
          </TabsList>
          <AddStaffDialog onAdd={(s) => { addStaff(s); toast.success(`${s.name} added`); }} />
        </div>

        <TabsContent value="doctors">
          <StaffTable
            people={doctors}
            onChangeDays={(id, days) => setStaffWorkingDays(id, days)}
            onRemove={(id) => { removeStaff(id); toast.success("Removed"); }}
            tone="doctor"
          />
        </TabsContent>
        <TabsContent value="tas">
          <StaffTable
            people={tas}
            onChangeDays={(id, days) => setStaffWorkingDays(id, days)}
            onRemove={(id) => { removeStaff(id); toast.success("Removed"); }}
            tone="ta"
          />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

function StaffTable({ people, onChangeDays, onRemove, tone }: { people: ReturnType<typeof useUniGuard>["staff"]; onChangeDays: (id: string, d: Day[]) => void; onRemove: (id: string) => void; tone: "doctor" | "ta" }) {
  const max = Math.max(1, ...people.map((p) => p.totalAssignments));
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
          <tr className="text-left">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-3 py-3 font-medium">Department</th>
            <th className="px-3 py-3 font-medium">Working days</th>
            <th className="px-3 py-3 font-medium">Workload</th>
            <th className="px-3 py-3 font-medium text-right"></th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id} className="border-t border-border hover:bg-accent/20 transition-smooth">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={cn("h-9 w-9 rounded-full grid place-items-center text-xs font-semibold", tone === "doctor" ? "bg-doctor-soft text-doctor" : "bg-ta-soft text-ta")}>
                    {p.name.replace(/^Dr\.\s*/, "").split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{p.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{p.department}</td>
              <td className="px-3 py-3">
                <DayBadges value={p.workingDays} onChange={(d) => onChangeDays(p.id, d)} size="sm" />
              </td>
              <td className="px-3 py-3 w-48">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full", tone === "doctor" ? "bg-doctor" : "bg-ta")} style={{ width: `${(p.totalAssignments / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-16 text-right">{p.totalAssignments}× assigned</span>
                </div>
              </td>
              <td className="px-3 py-3 text-right">
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onRemove(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddStaffDialog({ onAdd }: { onAdd: (s: { name: string; role: "doctor" | "ta"; department: string; workingDays: Day[] }) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"doctor" | "ta">("doctor");
  const [dept, setDept] = useState("Computer Science");
  const [days, setDays] = useState<Day[]>(["Sun", "Mon", "Tue", "Wed", "Thu"]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add person</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new staff member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setRole("doctor")} className={cn("rounded-lg border p-3 text-left transition-smooth", role === "doctor" ? "border-doctor bg-doctor-soft" : "border-border")}>
              <UserCog className="h-4 w-4 text-doctor mb-1" />
              <div className="text-sm font-semibold">Doctor</div>
              <div className="text-[11px] text-muted-foreground">Up to 2 rooms / slot</div>
            </button>
            <button onClick={() => setRole("ta")} className={cn("rounded-lg border p-3 text-left transition-smooth", role === "ta" ? "border-ta bg-ta-soft" : "border-border")}>
              <Users className="h-4 w-4 text-ta mb-1" />
              <div className="text-sm font-semibold">Teaching Assistant</div>
              <div className="text-[11px] text-muted-foreground">Exactly 1 room / slot</div>
            </button>
          </div>
          <div>
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={role === "doctor" ? "Dr. ..." : "Full name"} />
          </div>
          <div>
            <Label>Department</Label>
            <Input value={dept} onChange={(e) => setDept(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Working days</Label>
            <DayBadges value={days} onChange={setDays} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onAdd({ name: name.trim(), role, department: dept.trim() || "—", workingDays: days });
              setOpen(false);
              setName("");
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
