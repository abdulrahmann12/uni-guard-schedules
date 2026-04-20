import { useState } from "react";
import { AppLayout } from "@/components/uniguard/AppLayout";
import { useUniGuard } from "@/lib/uniguard/store";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, DoorOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { isLargeRoom } from "@/lib/uniguard/types";
import { toast } from "sonner";

export default function Rooms() {
  const { rooms, addRoom, removeRoom } = useUniGuard();
  return (
    <AppLayout
      title="Rooms"
      subtitle="Define exam halls and labs. Capacity ≥ 40 automatically requires 2 TAs."
      actions={<AddRoomDialog onAdd={(r) => { addRoom(r); toast.success(`${r.name} added`); }} />}
    >
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium">Room</th>
              <th className="px-3 py-3 font-medium">Capacity</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Required staff</th>
              <th className="px-3 py-3 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => {
              const large = isLargeRoom(r.capacity);
              return (
                <tr key={r.id} className="border-t border-border hover:bg-accent/20 transition-smooth">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                        <DoorOpen className="h-4 w-4" />
                      </div>
                      <div className="font-medium">{r.name}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{r.capacity} seats</td>
                  <td className="px-3 py-3">
                    <Badge className={large ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15" : "bg-muted text-muted-foreground border-border hover:bg-muted"}>
                      {large ? "Large" : "Small"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">1 Doctor + {large ? 2 : 1} TA{large ? "s" : ""}</td>
                  <td className="px-3 py-3 text-right">
                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => { removeRoom(r.id); toast.success("Room removed"); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}

function AddRoomDialog({ onAdd }: { onAdd: (r: { name: string; capacity: number }) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cap, setCap] = useState(30);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new room</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Room name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hall D, Room 305..." />
          </div>
          <div>
            <Label>Capacity</Label>
            <Input type="number" min={1} value={cap} onChange={(e) => setCap(parseInt(e.target.value) || 0)} />
            <p className="text-[11px] text-muted-foreground mt-1.5">{cap >= 40 ? "Will be tagged Large — 1 Doctor + 2 TAs" : "Will be tagged Small — 1 Doctor + 1 TA"}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!name.trim() || cap <= 0} onClick={() => { onAdd({ name: name.trim(), capacity: cap }); setOpen(false); setName(""); setCap(30); }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
