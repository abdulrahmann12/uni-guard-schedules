import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, Moon, Sun, FileDown, FileSpreadsheet, FileText, Settings as SettingsIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBranding } from "@/lib/branding/BrandingProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExportDialog } from "./ExportDialog";

export function AppLayout({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle?: string; actions?: ReactNode }) {
  const { theme, toggleTheme } = useBranding();
  const [exportMode, setExportMode] = useState<null | "pdf" | "xlsx">(null);
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-soft">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-3 border-b border-border bg-card/60 backdrop-blur px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="hidden md:flex items-center gap-2 max-w-sm flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search staff, rooms..." className="pl-9 h-9 bg-background/50" />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <FileDown className="h-4 w-4" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  <DropdownMenuLabel>Export current view</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setExportMode("pdf")} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-destructive" /> PDF document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExportMode("xlsx")} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 text-success" /> Excel workbook
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button onClick={toggleTheme} aria-label="Toggle theme" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition-smooth">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link to="/settings" aria-label="Settings" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition-smooth">
                <SettingsIcon className="h-4 w-4" />
              </Link>
              <button className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition-smooth">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
              </button>
              <div className="h-9 w-9 rounded-full bg-gradient-hero text-primary-foreground grid place-items-center text-sm font-semibold">AD</div>
            </div>
          </header>

          <div className="px-6 py-6 border-b border-border bg-card/30">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-display text-2xl md:text-3xl font-bold">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
              </div>
              {actions}
            </div>
          </div>

          <main className="flex-1 p-6 animate-fade-in">{children}</main>
        </div>
      </div>
      <ExportDialog open={exportMode !== null} onOpenChange={(o) => !o && setExportMode(null)} initialFormat={exportMode ?? "pdf"} />
    </SidebarProvider>
  );
}
