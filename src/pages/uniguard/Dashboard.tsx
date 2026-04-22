import { AppLayout } from "@/components/uniguard/AppLayout";
import { StatCard } from "@/components/uniguard/StatCard";
import { useUniGuard } from "@/lib/uniguard/store";
import { Users, UserCog, DoorOpen, CalendarCheck2, ArrowRight, Sparkles, AlertTriangle, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { staff, rooms, schedule, validateEntry } = useUniGuard();
  const chiefs = staff.filter((s) => s.role === "CHIEF_INVIGILATOR");
  const invigilators = staff.filter((s) => s.role === "INVIGILATOR");
  const totalAssignments = staff.reduce((sum, s) => sum + s.totalAssignments, 0);
  const conflicts = schedule.reduce((sum, entry) => sum + (validateEntry(entry).state === "VALID" ? 0 : 1), 0);
  const top = [...staff].sort((a, b) => b.totalAssignments - a.totalAssignments).slice(0, 5);

  return (
    <AppLayout title="Dashboard" subtitle="An at-a-glance view of your exam resource plan." actions={<Link to="/scheduler"><Button className="gap-2 shadow-elevated"><Sparkles className="h-4 w-4" /> Open Scheduler</Button></Link>}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={UserCog} tone="doctor" label="Chief Invigilators" value={chiefs.length} hint={`${chiefs.filter(d => d.workingDays.length === 5).length} fully available`} />
          <StatCard icon={Users} tone="ta" label="Invigilators" value={invigilators.length} hint={`${invigilators.filter(t => t.workingDays.length >= 4).length} highly available`} />
          <StatCard icon={DoorOpen} tone="primary" label="Exam Rooms" value={rooms.length} hint={`${rooms.reduce((sum, r) => sum + r.minInvigilators, 0)} required slots`} />
          <StatCard icon={CalendarCheck2} tone={conflicts > 0 ? "warning" : "primary"} label="Total Assignments" value={totalAssignments} hint={conflicts > 0 ? `${conflicts} slots to review` : "All clear"} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-card p-6"><div className="flex items-center justify-between mb-5"><div><h3 className="text-display text-lg font-semibold">Quick actions</h3><p className="text-sm text-muted-foreground">Jump into the most common workflows.</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[
            { to: "/scheduler", icon: Sparkles, title: "Generate a resource plan", desc: "Date, editable slot metadata, rooms, auto-assign.", tone: "bg-gradient-hero text-primary-foreground" },
            { to: "/timeline", icon: ListOrdered, title: "Master timeline", desc: "Search by staff or subject code.", tone: "bg-card border border-border" },
            { to: "/people", icon: Users, title: "Manage people", desc: "Edit roles and available days.", tone: "bg-card border border-border" },
            { to: "/rooms", icon: DoorOpen, title: "Manage rooms", desc: "Set capacities and minimum invigilators.", tone: "bg-card border border-border" },
          ].map((q) => <Link key={q.title} to={q.to} className={`group rounded-lg p-4 transition-smooth hover:-translate-y-0.5 hover:shadow-elevated ${q.tone}`}><div className="flex items-start justify-between"><q.icon className="h-5 w-5" /><ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-smooth" /></div><div className="mt-6"><div className="text-display font-semibold">{q.title}</div><div className={`text-xs mt-1 ${q.tone.includes("gradient") ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{q.desc}</div></div></Link>)}</div></div>
          <div className="rounded-xl border border-border bg-card shadow-card p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-display text-lg font-semibold">Top assigned</h3><span className="text-xs text-muted-foreground">Workload</span></div><ul className="space-y-3">{top.map((s, i) => <li key={s.id} className="flex items-center gap-3"><div className="text-xs font-mono text-muted-foreground w-4">{i + 1}</div><div className={`h-8 w-8 rounded-full grid place-items-center text-[11px] font-semibold ${s.role === "CHIEF_INVIGILATOR" ? "bg-chief-soft text-chief" : "bg-invigilator-soft text-invigilator"}`}>{s.name.replace(/^Dr\.\s*/, "").split(" ").map(p => p[0]).slice(0,2).join("")}</div><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{s.name}</div><div className="text-[11px] text-muted-foreground">{s.role === "CHIEF_INVIGILATOR" ? "Chief Invigilator" : "Invigilator"} · {s.department}</div></div><div className="text-sm font-semibold tabular-nums">{s.totalAssignments}</div></li>)}{top.every(s => s.totalAssignments === 0) && <li className="text-xs text-muted-foreground py-4 text-center">No assignments yet — generate a schedule to see fairness analytics here.</li>}</ul></div>
        </div>
        {conflicts > 0 && <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3 animate-fade-in"><AlertTriangle className="h-5 w-5 text-destructive" /><div className="flex-1"><div className="text-sm font-medium text-destructive">{conflicts} slots need review</div><div className="text-xs text-destructive/80">Open the Scheduler to manually fix or regenerate affected slots.</div></div><Link to="/scheduler"><Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">Resolve</Button></Link></div>}
      </div>
    </AppLayout>
  );
}
