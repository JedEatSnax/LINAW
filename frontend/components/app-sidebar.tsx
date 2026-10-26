"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
//import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
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
  UsersRoundCollaboration,
  Receipt,
  ClipboardList,
  Workflow,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  ScrollTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SlidersHorizontal,
} from "lucide-react";

const data = {
  user: {
    name: "Amina Okafor",
    email: "amina@northstar.edu",
    avatar: "",
  },
  navMain: [
    {
      title: "Administration",
      url: "/administration",
      icon: <LayoutDashboardIcon />,
      isActive: true,
    },
    {
      title: "Purchase Requisitions",
      url: "/purchase-requisitions",
      icon: <ClipboardList />,
    },
    {
      title: "Purchase Orders",
      url: "/purchase-orders",
      icon: <Receipt />,
    },
    {
      title: "Approval Workflows",
      url: "/approval-workflows",
      icon: <Workflow />,
    },
    {
      title: "Supplier Management",
      url: "/supplier-management",
      icon: <UsersRoundCollaboration />,
    },
    {
      title: "Audit Trail",
      url: "/audit-trail",
      icon: <ScrollTextIcon />,
    },
    {
      title: "Organization Settings",
      url: "/organization-settings",
      icon: <SlidersHorizontal />,
    },
  ],
  navSecondary: [
    {
      title: "Organization settings",
      url: "/organizations",
      icon: <Settings2Icon />,
    },
    {
      title: "Support center",
      url: "#",
      icon: <LifeBuoyIcon />,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "User",
    email: "",
    avatar: "",
  });

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch(
          "/api/backend/userManagementRouter/profile",
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) return;

        const result = (await response.json()) as {
          data?: {
            first_name?: string;
            last_name?: string;
            email?: string;
          };
        };
        const firstName = result.data?.first_name?.trim() ?? "";
        const lastName = result.data?.last_name?.trim() ?? "";
        const name = [firstName, lastName].filter(Boolean).join(" ");

        setUser({
          name: name || "User",
          email: result.data?.email?.trim() ?? "",
          avatar: "",
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, []);

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<a href="/organizations" aria-label="Organizations" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#1c63f2] text-white shadow-sm">
                <ShieldCheckIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-tight">
                  LINAW
                </span>
                <span className="truncate text-[11px] text-sidebar-foreground/55">
                  Procurement Operations
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
