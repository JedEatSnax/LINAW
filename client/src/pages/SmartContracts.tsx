import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { type CSSProperties } from "react"
import data from "./data.json"

export default function SmartContract() {
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
        <SiteHeader title="Smart Contracts" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Dialog>
                <form className="px-4 md:px-6">
                  <DialogTrigger asChild>
                    <Button variant="outline">Create Smart Contract</Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <h2 className="text-lg font-semibold">Create Smart Contract</h2>
                      <p className="text-sm text-muted-foreground">
                        Make changes to your profile here. Click save when
                        you&apos;re done.
                      </p>
                    </DialogHeader>

                    <Field>
                      <label htmlFor="name-1" className="text-sm font-medium">
                        Smart Contract Name
                      </label>
                      <input
                        id="name-1"
                        name="name"
                        defaultValue="My Smart Contract"
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </Field>

                    <DialogFooter>
                      <Button type="submit">Save changes</Button>
                      <DialogClose asChild>
                        <Button type="button" variant="destructive">Cancel</Button>
                      </DialogClose>    
                    </DialogFooter>
                  </DialogContent>
                </form>
              </Dialog>

              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
