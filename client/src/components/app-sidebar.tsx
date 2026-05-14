import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ChartBarIcon,
  UsersIcon,
  ScrollText,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { getAuth, onAuthStateChanged } from "firebase/auth"

const navMainData = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Organizations",
    url: "/organizations",
    icon: <UsersIcon />,
  },
  {
    title: "Smart Contracts",
    url: "/smart-contracts",
    icon: <ScrollText />,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: <ChartBarIcon />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  })

  React.useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName || "User",
          email: currentUser.email || "user@example.com",
          avatar: currentUser.photoURL || "/avatars/shadcn.jpg",
        })
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <NavLink to="/dashboard">
                <span className="text-base font-semibold">LINAW</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainData} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
