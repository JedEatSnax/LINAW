"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useAuthState } from "@/components/auth-state-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  FileCheck2Icon,
  FileTextIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  ScrollTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersRoundIcon,
} from "lucide-react";

const data = {
  navMain: [
    { title: "Overview", url: "/dashboard", icon: <LayoutDashboardIcon />, isActive: true },
    { title: "Purchase Requisitions", url: "/purchase-requisitions", icon: <FileTextIcon /> },
    { title: "Approval Workflows", url: "/approval-workflows", icon: <GitBranchIcon /> },
    { title: "Supplier Management", url: "/supplier-management", icon: <UsersRoundIcon /> },
    { title: "Supplier Portal", url: "/supplier-portal", icon: <UsersRoundIcon /> },
    { title: "Purchase Orders", url: "/purchase-orders", icon: <FileCheck2Icon /> },
    { title: "Audit Trail", url: "/audit-trail", icon: <ScrollTextIcon /> },
    { title: "Organization settings", url: "/organization-settings", icon: <Settings2Icon /> },
  ],
  navSecondary: [
    { title: "Support center", url: "#", icon: <LifeBuoyIcon /> },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile } = useAuthState();
  const user = {
    name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "User",
    email: profile?.email ?? "",
    avatar: "",
  };

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/organizations" aria-label="Organizations" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#1c63f2] text-white shadow-sm">
                <ShieldCheckIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-tight">LINAW</span>
                <span className="truncate text-[11px] text-sidebar-foreground/55">Procurement operations</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
