import { useRef, useState } from "react";
import { AppLayout } from "@/components/uniguard/AppLayout";
import { useBranding } from "@/lib/branding/BrandingProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, RotateCcw, Sun, Moon, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { appName, appTagline, university, department, examPeriod, logoDataUrl, theme, toggleTheme, updateBranding, resetBranding } = useBranding();
  const [draft, setDraft] = useState({ appName, appTagline, university, department, examPeriod });
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    if (file.size > 1024 * 1024) return toast.error("Logo must be under 1MB");
    const reader = new FileReader();
    reader.onload = () => {
      updateBranding({ logoDataUrl: reader.result as string });
      toast.success("Logo updated");
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppLayout title="Settings" subtitle="Customize your branding, theme, and exported document headers.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        <section className="rounded-xl border border-border bg-card shadow-card p-6 space-y-5">
          <header>
            <h3 className="text-display text-lg font-semibold">Brand identity</h3>
            <p className="text-sm text-muted-foreground">These settings appear in the navbar, sidebar, and exported documents.</p>
          </header>

          <div>
            <Label className="mb-2 block">Logo</Label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl border border-dashed border-border bg-muted/40 grid place-items-center overflow-hidden">
                {logoDataUrl ? <img src={logoDataUrl} alt="Brand logo" className="h-full w-full object-contain" /> : <span className="text-[10px] text-muted-foreground text-center px-1">No logo</span>}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
                <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> Upload logo</Button>
                {logoDataUrl && <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => updateBranding({ logoDataUrl: null })}><Trash2 className="h-3.5 w-3.5" /> Remove</Button>}
                <p className="text-[11px] text-muted-foreground">PNG/SVG, &lt; 1MB recommended.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>System name</Label><Input value={draft.appName} onChange={(e) => setDraft({ ...draft, appName: e.target.value })} /></div>
            <div><Label>Tagline</Label><Input value={draft.appTagline} onChange={(e) => setDraft({ ...draft, appTagline: e.target.value })} /></div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button onClick={() => { updateBranding(draft); toast.success("Branding saved"); }}>Save changes</Button>
            <Button variant="outline" className="gap-2" onClick={() => { resetBranding(); setDraft({ appName: "InvigiCore", appTagline: "Smart Exam Invigilation", university: "Cairo University", department: "Faculty of Engineering", examPeriod: "Final Exams — Spring 2026" }); toast.success("Branding reset"); }}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card shadow-card p-6 space-y-5">
          <header>
            <h3 className="text-display text-lg font-semibold">Appearance</h3>
            <p className="text-sm text-muted-foreground">Choose your preferred theme. The setting is saved on this device.</p>
          </header>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => theme === "dark" && toggleTheme()} className={`rounded-lg border p-4 text-left transition-smooth ${theme === "light" ? "border-primary bg-primary/5" : "border-border"}`}>
              <Sun className="h-5 w-5 mb-2" />
              <div className="text-sm font-semibold">Light</div>
              <div className="text-[11px] text-muted-foreground">Crisp daylight UI</div>
            </button>
            <button onClick={() => theme === "light" && toggleTheme()} className={`rounded-lg border p-4 text-left transition-smooth ${theme === "dark" ? "border-primary bg-primary/5" : "border-border"}`}>
              <Moon className="h-5 w-5 mb-2" />
              <div className="text-sm font-semibold">Dark</div>
              <div className="text-[11px] text-muted-foreground">Low-light, high contrast</div>
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card shadow-card p-6 space-y-5 lg:col-span-2">
          <header>
            <h3 className="text-display text-lg font-semibold">Exported document header</h3>
            <p className="text-sm text-muted-foreground">Used as the header of every PDF and Excel export.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>University</Label><Input value={draft.university} onChange={(e) => setDraft({ ...draft, university: e.target.value })} /></div>
            <div><Label>Department / Faculty</Label><Input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} /></div>
            <div><Label>Exam period</Label><Input value={draft.examPeriod} onChange={(e) => setDraft({ ...draft, examPeriod: e.target.value })} /></div>
          </div>
          <Button onClick={() => { updateBranding(draft); toast.success("Document header saved"); }}>Save document header</Button>
        </section>
      </div>
    </AppLayout>
  );
}