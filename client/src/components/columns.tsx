"use client"

import { createColumnHelper } from "@tanstack/react-table"

import { type DataTableFeatures } from "./data-table-features"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type User = {
  id: number
  email: string
  name: string
  occupation: string
  status: string
  created_at: string
  updated_at: string
}

export type License = {
  id: number
  name: string
  product_key: string
  expiration_date?: string
  licensedTo?: User
  licensedToEmail: string
  manufacturer: string
  minimum_quantity?: number
}

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, License>()

export const columns = columnHelper.columns([
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("product_key", {
    header: "Product_Key",
  }),
])
