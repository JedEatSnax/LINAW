"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMiscellaneous({
  miscellaneous,
}: {
  miscellaneous: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Miscellaneous</SidebarGroupLabel>
      <SidebarMenu>
        {miscellaneous.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton render={<a href={item.url} />}>
              {item.icon}
              <span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
