import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { lazy, Suspense, type CSSProperties } from "react"

import data from "./data.json"

const ChartAreaInteractive = lazy(() =>
  import("@/components/chart-area-interactive").then((mod) => ({
    default: mod.ChartAreaInteractive,
  }))
)

const DataTable = lazy(() =>
  import("@/components/data-table").then((mod) => ({
    default: mod.DataTable,
  }))
)

export default function Dashboard() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <Suspense fallback={<Skeleton className="h-62.5 w-full" />}>
                  <ChartAreaInteractive />
                </Suspense>
              </div>
              <Suspense fallback={<Skeleton className="h-105 w-full" />}>
                <DataTable data={data} />
              </Suspense>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
