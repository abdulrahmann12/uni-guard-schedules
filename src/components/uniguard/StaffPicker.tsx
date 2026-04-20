import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Staff } from "@/lib/uniguard/types";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  trigger: React.ReactNode;
  candidates: Staff[];
  currentId: string | null;
  onPick: (id: string | null) => void;
  emptyText?: string;
}

export function StaffPicker({ trigger, candidates, currentId, onPick, emptyText = "No best fit available" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search best fits..." />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup heading="Best fits (available & under-utilized)">
              {candidates.slice(0, 30).map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.name}
                  onSelect={() => {
                    onPick(s.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.totalAssignments}×</span>
                    {currentId === s.id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </CommandItem>
              ))}
              {currentId && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onPick(null);
                    setOpen(false);
                  }}
                  className={cn("text-destructive")}
                >
                  <X className="mr-2 h-3.5 w-3.5" /> Clear assignment
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
