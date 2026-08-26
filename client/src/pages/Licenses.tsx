/*
import { useEffect, useState } from "react"

import type { License } from "@/types/api"
import { DataTable } from "@/components/data-table"
import { columns } from "./columns/licenses"
*/
export default function LicensesPage() {
  {
    /*
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)

  const apiURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const res = await fetch(`${apiURL}/licenses`)

        if (!res.ok) {
          throw new Error("Failed to fetch licenses")
        }

        const data: License[] = await res.json()

        setLicenses(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchLicenses()
  }, [apiURL])

  if (loading) {
    return <div>Loading licenses...</div>
  }
  */
  }
  return <main>{/* <DataTable columns={columns} data={licenses} /> */}</main>
}
