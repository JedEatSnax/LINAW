"use client";

import * as React from "react";
import Link from "next/link";

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
  UsersRoundIcon,
  Receipt,
  ClipboardList,
  Workflow,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  ScrollTextIcon,
  Settings2Icon,
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
      title: "Dashboard",
      url: "/dashboard",
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
      icon: <UsersRoundIcon />,
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
              render={
                /* 2. Replace <a> with Next.js <Link> */
                <Link
                  href="/organization-settings"
                  aria-label="Organizations"
                />
              }
            >
              {/* 3. Add size-8 (h-8 w-8) and shrink-0 to prevent flexbox from squishing the logo */}
              <svg
                className="size-10 shrink-0 fill-slate-900 transition-colors dark:fill-white"
                viewBox="0 0 128 128"
                aria-hidden
              >
                <path
                  d="M84.466 0L63.887 36.578H22.756L43.321 0z"
                  opacity=".45"
                ></path>
                <path
                  d="M63.887 36.576h41.145L84.468 0H43.323z"
                  opacity=".6"
                ></path>
                <path
                  d="M43.323 73.138l20.565-36.562L43.323 0 22.759 36.576z"
                  opacity=".8"
                ></path>
                <path
                  d="M43.521 128L64.1 91.424h41.145L84.666 128z"
                  opacity=".45"
                ></path>
                <path
                  d="M64.1 91.426H22.955l20.564 36.575h41.145z"
                  opacity=".6"
                ></path>
                <path
                  d="M84.666 54.864L64.102 91.426l20.564 36.575 20.579-36.575z"
                  opacity=".8"
                ></path>
              </svg>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-xl tracking-tight">
                  LINAW
                </span>
                <span className="truncate text-[11px] text-sidebar-foreground/55">
                  Procurement
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
