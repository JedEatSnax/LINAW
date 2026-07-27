"use client"

import * as React from "react"

import { NavResources } from "@/components/nav-resources"
import { NavProcurements } from "@/components/nav-procurements"
import { NavMiscellaneous } from "@/components/nav-miscellaneous"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  HandCoinsIcon,
  ShoppingCartIcon,
  MonitorSmartphoneIcon,
  HardDriveIcon,
  KeyboardIcon,
  DropletsIcon,
  SaveIcon,
  ChartNoAxesCombinedIcon,
  UsersIcon,
  FileIcon,
  BotMessageSquareIcon,
} from "lucide-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  procurements: [
    {
      title: "Purchases",
      url: "#",
      icon: <ShoppingCartIcon />,
      items: [
        {
          title: "Requests",
          url: "/requests",
        },
        {
          title: "Quotes",
          url: "/quotes",
        },
        {
          title: "Orders",
          url: "/orders",
        },
        {
          title: "Receivables",
          url: "/receivables",
        },
      ],
    },
    {
      title: "Payables",
      url: "#",
      icon: <HandCoinsIcon />,
      items: [
        {
          title: "Inbox",
          url: "/inbox",
        },
        {
          title: "Bills",
          url: "/bills",
        },
        {
          title: "Batch Payments",
          url: "/batch-payments",
        },
        {
          title: "Payment History",
          url: "/payment-history",
        },
        {
          title: "Vendor Credits",
          url: "/vendor-credits",
        },
      ],
    },
  ],
  resources: [
    {
      name: "Assets",
      url: "/assets",
      icon: <MonitorSmartphoneIcon />,
    },
    {
      name: "Components",
      url: "/components",
      icon: <HardDriveIcon />,
    },
    {
      name: "Peripherals",
      url: "/peripherals",
      icon: <KeyboardIcon />,
    },
    {
      name: "Consumables",
      url: "/consumables",
      icon: <DropletsIcon />,
    },
    {
      name: "Licenses",
      url: "/licenses",
      icon: <SaveIcon />,
    },
  ],
  miscellaneous: [
    {
      name: "Analytics",
      url: "/analytics",
      icon: <ChartNoAxesCombinedIcon />,
    },
    {
      name: "Users",
      url: "/users",
      icon: <UsersIcon />,
    },
    {
      name: "Files",
      url: "/files",
      icon: <FileIcon />,
    },
    {
      name: "Chatbot",
      url: "/chatbot",
      icon: <BotMessageSquareIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavProcurements procurements={data.procurements} />
        <NavResources resources={data.resources} />
        <NavMiscellaneous miscellaneous={data.miscellaneous} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
