import { CalendarRange, Clock3, DoorOpen, LayoutDashboard, ListOrdered, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useBranding } from "@/lib/branding/BrandingProvider";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Scheduler", url: "/scheduler", icon: Sparkles },
  { title: "Timeline", url: "/timeline", icon: CalendarRange },
  { title: "People", url: "/people", icon: Users },
  { title: "Rooms", url: "/rooms", icon: DoorOpen },
  { title: "Time Slots", url: "/time-slots", icon: Clock3 },
  { title: "Assignments", url: "/assignments", icon: ListOrdered },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { appName, appTagline, logoDataUrl } = useBranding();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-elevated overflow-hidden shrink-0">
            {logoDataUrl ? <img src={logoDataUrl} alt={appName} className="h-full w-full object-contain" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-display text-base font-bold truncate">{appName}</span>
              <span className="text-[11px] text-muted-foreground truncate">{appTagline}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end
                        className={cn(
                          "transition-smooth",
                          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
