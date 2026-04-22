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
import { Day, Role, roleLabel } from "@/lib/uniguard/types";
import { StaffProfileDialog } from "@/components/uniguard/StaffProfileDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function People() {
  const { staff, setStaffWorkingDays, addStaff, removeStaff } = useUniGuard();
  const chiefs = staff.filter((s) => s.role === "CHIEF_INVIGILATOR");
  const invigilators = staff.filter((s) => s.role === "INVIGILATOR");
  const [profileId, setProfileId] = useState<string | null>(null);

  return (
    <AppLayout title="People" subtitle="Manage Chief Invigilators and Invigilators, their availability and workload.">
      <Tabs defaultValue="chiefs" className="space-y-5">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="chiefs" className="gap-2"><UserCog className="h-4 w-4" /> Chief Invigilators <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-chief-soft text-chief">{chiefs.length}</span></TabsTrigger>
            <TabsTrigger value="invigilators" className="gap-2"><Users className="h-4 w-4" /> Invigilators <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-invigilator-soft text-invigilator">{invigilators.length}</span></TabsTrigger>
          </TabsList>
          <AddStaffDialog onAdd={(s) => { addStaff(s); toast.success(`${s.name} added`); }} />
        </div>
        <TabsContent value="chiefs"><StaffTable people={chiefs} onChangeDays={(id, days) => setStaffWorkingDays(id, days)} onRemove={(id) => { removeStaff(id); toast.success("Removed"); }} onOpenProfile={setProfileId} tone="chief" /></TabsContent>
        <TabsContent value="invigilators"><StaffTable people={invigilators} onChangeDays={(id, days) => setStaffWorkingDays(id, days)} onRemove={(id) => { removeStaff(id); toast.success("Removed"); }} onOpenProfile={setProfileId} tone="invigilator" /></TabsContent>
      </Tabs>
      <StaffProfileDialog staffId={profileId} open={!!profileId} onOpenChange={(o) => !o && setProfileId(null)} />
    </AppLayout>
  );
}

function StaffTable({ people, onChangeDays, onRemove, onOpenProfile, tone }: { people: ReturnType<typeof useUniGuard>["staff"]; onChangeDays: (id: string, d: Day[]) => void; onRemove: (id: string) => void; onOpenProfile: (id: string) => void; tone: "chief" | "invigilator" }) {
  const max = Math.max(1, ...people.map((p) => p.totalAssignments));
  const avg = people.reduce((s, p) => s + p.totalAssignments, 0) / Math.max(1, people.length);
  return <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden"><table className="w-full text-sm"><thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground"><tr className="text-left"><th className="px-5 py-3 font-medium">Name</th><th className="px-3 py-3 font-medium">Department</th><th className="px-3 py-3 font-medium">Available days</th><th className="px-3 py-3 font-medium">Workload</th><th className="px-3 py-3 font-medium text-right"></th></tr></thead><tbody>{people.map((p) => <tr key={p.id} className="border-t border-border hover:bg-accent/20 transition-smooth"><td className="px-5 py-3"><button onClick={() => onOpenProfile(p.id)} className="flex items-center gap-3 text-left hover:text-primary transition-smooth"><div className={cn("h-9 w-9 rounded-full grid place-items-center text-xs font-semibold", tone === "chief" ? "bg-chief-soft text-chief" : "bg-invigilator-soft text-invigilator")}>{p.name.replace(/^Dr\.\s*/, "").split(" ").map((s) => s[0]).slice(0, 2).join("")}</div><div><div className="font-medium">{p.name}</div><div className="text-[11px] text-muted-foreground font-mono">{p.id}</div></div></button></td><td className="px-3 py-3 text-muted-foreground">{p.department}</td><td className="px-3 py-3"><DayBadges value={p.workingDays} onChange={(d) => onChangeDays(p.id, d)} size="sm" /></td><td className="px-3 py-3 w-48"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full", tone === "chief" ? "bg-chief" : "bg-invigilator")} style={{ width: `${(p.totalAssignments / max) * 100}%` }} /></div><span className={cn("text-xs font-semibold tabular-nums w-20 text-right", p.totalAssignments > Math.max(2, Math.ceil(avg * 1.5)) && "text-warning")}>{p.totalAssignments}× assigned</span></div></td><td className="px-3 py-3 text-right"><Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onRemove(p.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div>;
}

function AddStaffDialog({ onAdd }: { onAdd: (s: { name: string; role: Role; department: string; workingDays: Day[] }) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("CHIEF_INVIGILATOR");
  const [dept, setDept] = useState("Computer Science");
  const [days, setDays] = useState<Day[]>(["Sun", "Mon", "Tue", "Wed", "Thu"]);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Add person</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add a new staff member</DialogTitle></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><button onClick={() => setRole("CHIEF_INVIGILATOR")} className={cn("rounded-lg border p-3 text-left transition-smooth", role === "CHIEF_INVIGILATOR" ? "border-chief bg-chief-soft" : "border-border")}><UserCog className="h-4 w-4 text-chief mb-1" /><div className="text-sm font-semibold">Chief Invigilator</div><div className="text-[11px] text-muted-foreground">رئيس لجنة · up to 2 rooms</div></button><button onClick={() => setRole("INVIGILATOR")} className={cn("rounded-lg border p-3 text-left transition-smooth", role === "INVIGILATOR" ? "border-invigilator bg-invigilator-soft" : "border-border")}><Users className="h-4 w-4 text-invigilator mb-1" /><div className="text-sm font-semibold">Invigilator</div><div className="text-[11px] text-muted-foreground">مراقب · 1 room / slot</div></button></div><div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={role === "CHIEF_INVIGILATOR" ? "Dr. ..." : "Full name"} /></div><div><Label>Department</Label><Input value={dept} onChange={(e) => setDept(e.target.value)} /></div><div><Label className="mb-2 block">Available days</Label><DayBadges value={days} onChange={setDays} /></div></div><DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name.trim()} onClick={() => { onAdd({ name: name.trim(), role, department: dept.trim() || "—", workingDays: days }); setOpen(false); setName(""); }}>{roleLabel(role)} added</Button></DialogFooter></DialogContent></Dialog>;
}
