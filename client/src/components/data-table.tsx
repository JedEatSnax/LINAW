"use client"

import { useId, useMemo, useState } from "react"

import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  GripVerticalIcon,
} from "lucide-react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"

import Papa from "papaparse"
import * as XLSX from "xlsx"

type PaymentStatus = "failed" | "processing" | "success"

type SortDirection = "asc" | "desc"

type SortableColumn = "amount" | "email" | "name" | "status"

type SortConfig = {
  column: SortableColumn
  direction: SortDirection
}

type ColumnConfig = {
  key: SortableColumn
  label: string
}

type Payment = {
  amount: number
  email: string
  id: string
  name: string
  status: PaymentStatus
}

const data: readonly Payment[] = [
  {
    id: "PAY-101",
    name: "Shang Chain",
    amount: 699,
    status: "success",
    email: "shang07@yahoo.com",
  },
  {
    id: "PAY-102",
    name: "Kevin Lincoln",
    amount: 242,
    status: "success",
    email: "kevinli09@gmail.com",
  },
  {
    id: "PAY-103",
    name: "Milton Rose",
    amount: 655,
    status: "processing",
    email: "rose96@gmail.com",
  },
  {
    id: "PAY-104",
    name: "Silas Ryan",
    amount: 874,
    status: "success",
    email: "silas22@gmail.com",
  },
  {
    id: "PAY-105",
    name: "Ben Tenison",
    amount: 541,
    status: "failed",
    email: "bent@hotmail.com",
  },
  {
    id: "PAY-106",
    name: "Alice Cooper",
    amount: 321,
    status: "processing",
    email: "alice@email.com",
  },
  {
    id: "PAY-107",
    name: "Bob Johnson",
    amount: 789,
    status: "success",
    email: "bob.j@company.com",
  },
  {
    id: "PAY-108",
    name: "Carol Williams",
    amount: 456,
    status: "processing",
    email: "carol.w@domain.org",
  },
] as const

const availabilityBadgeClass: Record<PaymentStatus, string> = {
  success:
    "border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  failed:
    "border-none bg-destructive/10 text-destructive dark:bg-destructive/20",
  processing:
    "border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)

const defaultColumns: readonly ColumnConfig[] = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "email", label: "Email" },
  { key: "amount", label: "Amount" },
] as const

const renderCellValue = (item: Payment, key: SortableColumn) => {
  switch (key) {
    case "name":
      return <div className="font-medium">{item.name}</div>
    case "status":
      return (
        <Badge className={availabilityBadgeClass[item.status]}>
          {item.status}
        </Badge>
      )
    case "email":
      return <div className="text-muted-foreground lowercase">{item.email}</div>
    case "amount":
      return <div className="font-medium">{formatCurrency(item.amount)}</div>
  }
}

const DraggableHeader = ({
  column,
  direction,
  onToggleSort,
}: {
  column: ColumnConfig
  direction?: SortDirection
  onToggleSort: (column: SortableColumn) => void
}) => {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.key })

  return (
    <TableHead
      ref={setNodeRef}
      className="h-12 bg-muted/20 text-[13px] font-medium tracking-[0.08em] text-muted-foreground"
      style={{
        opacity: isDragging ? 0.85 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="-ml-2 size-7 text-muted-foreground hover:bg-background hover:text-foreground"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVerticalIcon
              className="size-4 opacity-60"
              aria-hidden="true"
            />
          </Button>
          <span className="truncate">{column.label}</span>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="group -mr-1 size-7 text-muted-foreground hover:bg-background hover:text-foreground"
          onClick={() => onToggleSort(column.key)}
          aria-label={`Sort by ${column.label}`}
        >
          {direction === "asc" ? (
            <ChevronUpIcon className="size-4 opacity-60" aria-hidden="true" />
          ) : direction === "desc" ? (
            <ChevronDownIcon className="size-4 opacity-60" aria-hidden="true" />
          ) : (
            <ChevronUpIcon
              className="size-4 opacity-0 group-hover:opacity-60"
              aria-hidden="true"
            />
          )}
        </Button>
      </div>
    </TableHead>
  )
}

const DataTable = () => {
  const id = useId()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [columnOrder, setColumnOrder] = useState<SortableColumn[]>(
    defaultColumns.map((column) => column.key)
  )
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: "name",
    direction: "asc",
  })

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  )

  const orderedColumns = useMemo(
    () =>
      columnOrder
        .map((key) => defaultColumns.find((column) => column.key === key))
        .filter((column): column is ColumnConfig => Boolean(column)),
    [columnOrder]
  )

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return data
    }

    return data.filter((item) =>
      [item.name, item.email, item.status, String(item.amount)].some((value) =>
        value.toLowerCase().includes(query)
      )
    )
  }, [searchQuery])

  const sortedData = useMemo(() => {
    const sorted = [...filteredData]

    sorted.sort((left, right) => {
      const leftValue = left[sortConfig.column]
      const rightValue = right[sortConfig.column]

      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue))

      return sortConfig.direction === "asc" ? comparison : -comparison
    })

    return sorted
  }, [filteredData, sortConfig])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const pageStart = safePageIndex * pageSize
  const pageEnd = pageStart + pageSize
  const paginatedData = sortedData.slice(pageStart, pageEnd)

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(item.id))
  const someSelected =
    paginatedData.some((item) => selectedIds.includes(item.id)) && !allSelected

  const selectedRows = data.filter((item) => selectedIds.includes(item.id))

  const exportRows = (): Payment[] => [
    ...(selectedRows.length > 0 ? selectedRows : filteredData),
  ]

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds((current) =>
        Array.from(
          new Set([...current, ...paginatedData.map((item) => item.id)])
        )
      )
      return
    }

    setSelectedIds((current) =>
      current.filter((id) => !paginatedData.some((item) => item.id === id))
    )
  }

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id]
      }

      return current.filter((item) => item !== id)
    })
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    const csv = Papa.unparse(exportRows(), { header: true })
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `payments-export-${new Date().toISOString().split("T")[0]}.csv`
    )
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows())
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments")
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 28 },
      { wch: 14 },
    ]

    XLSX.writeFile(
      workbook,
      `payments-export-${new Date().toISOString().split("T")[0]}.xlsx`
    )
  }

  const exportToJSON = () => {
    const json = JSON.stringify(exportRows(), null, 2)
    downloadBlob(
      new Blob([json], { type: "application/json" }),
      `payments-export-${new Date().toISOString().split("T")[0]}.json`
    )
  }

  const changePageSize = (value: string | null) => {
    if (!value) {
      return
    }

    setPageSize(Number(value))
    setPageIndex(0)
  }

  const toggleSort = (column: SortableColumn) => {
    setSortConfig((current) => {
      if (current.column === column) {
        return {
          column,
          direction: current.direction === "asc" ? "desc" : "asc",
        }
      }

      return {
        column,
        direction: "asc",
      }
    })
  }

  const currentRangeStart = sortedData.length === 0 ? 0 : pageStart + 1
  const currentRangeEnd = Math.min(pageEnd, sortedData.length)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setColumnOrder((current) => {
      const oldIndex = current.indexOf(active.id as SortableColumn)
      const newIndex = current.indexOf(over.id as SortableColumn)

      return arrayMove(current, oldIndex, newIndex)
    })
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search all columns..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-10 w-full max-w-sm rounded-lg border-border/60 bg-muted/20 px-4"
          />
        </div>
        <div className="flex items-center gap-2 lg:justify-end">
          <div className="text-sm text-muted-foreground">
            {selectedRows.length > 0 ? (
              <span className="mr-2">
                {selectedRows.length} of {filteredData.length} row(s) selected
              </span>
            ) : null}
          </div>
          <Dialog>
            <form>
              <DialogTrigger
                render={
                  <Button className="inline-flex h-10 min-w-28 items-center justify-center rounded-md border border-border/60 bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted/20">
                    Add
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when
                    you&apos;re done.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="name-1">Name</Label>
                    <Input
                      id="name-1"
                      name="name"
                      defaultValue="Pedro Duarte"
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="username-1">Username</Label>
                    <Input
                      id="username-1"
                      name="username"
                      defaultValue="@peduarte"
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <DialogClose
                    render={<Button variant="outline">Cancel</Button>}
                  />
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </form>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-10 min-w-28 items-center justify-center rounded-md border border-border/60 bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted/20">
              <DownloadIcon className="mr-2 size-4" />
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={exportToCSV}
                className="whitespace-nowrap"
              >
                <FileTextIcon className="mr-2 size-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportToExcel}
                className="whitespace-nowrap"
              >
                <FileSpreadsheetIcon className="mr-2 size-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportToJSON}
                className="whitespace-nowrap"
              >
                <FileTextIcon className="mr-2 size-4" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="min-w-0 overflow-x-auto rounded-xl border border-border/60 bg-background shadow-sm">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <Table className="w-full min-w-225">
            <TableHeader>
              <TableRow>
                <TableHead className="h-12 w-10 bg-muted/20 font-medium">
                  <Checkbox
                    checked={allSelected}
                    aria-checked={someSelected ? "mixed" : allSelected}
                    onCheckedChange={(value) => toggleAll(!!value)}
                    aria-label="Select all filtered rows"
                    className="after:hidden data-checked:border-sky-600 data-checked:bg-sky-600 data-checked:text-white dark:data-checked:border-sky-500 dark:data-checked:bg-sky-500 dark:data-checked:text-white"
                  />
                </TableHead>
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {orderedColumns.map((column) => {
                    const direction =
                      sortConfig.column === column.key
                        ? sortConfig.direction
                        : undefined

                    return (
                      <DraggableHeader
                        key={column.key}
                        column={column}
                        direction={direction}
                        onToggleSort={toggleSort}
                      />
                    )
                  })}
                </SortableContext>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => {
                  const isSelected = selectedIds.includes(item.id)

                  return (
                    <TableRow
                      key={item.id}
                      data-state={isSelected ? "selected" : undefined}
                      className="hover:bg-muted/10 data-[state=selected]:bg-muted/20"
                    >
                      <TableCell className="py-3.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(value) =>
                            toggleRow(item.id, !!value)
                          }
                          aria-label={`Select ${item.name}`}
                          className="after:hidden data-checked:border-sky-600 data-checked:bg-sky-600 data-checked:text-white dark:data-checked:border-sky-500 dark:data-checked:bg-sky-500 dark:data-checked:text-white"
                        />
                      </TableCell>
                      {orderedColumns.map((column) => (
                        <TableCell
                          key={`${item.id}-${column.key}`}
                          className="py-3.5"
                        >
                          {renderCellValue(item, column.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          <Label htmlFor={id} className="max-sm:sr-only">
            Rows per page
          </Label>
          <Select value={pageSize.toString()} onValueChange={changePageSize}>
            <SelectTrigger
              id={id}
              className="h-9 w-fit border-border/60 whitespace-nowrap max-sm:w-full"
            >
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]]:pr-8 [&_*[role=option]]:pl-2 [&_*[role=option]>span]:right-2 [&_*[role=option]>span]:left-auto">
              {[5, 10, 25, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-center text-sm whitespace-nowrap text-muted-foreground lg:flex-1 lg:justify-end">
          <p className="text-sm whitespace-nowrap" aria-live="polite">
            <span className="text-foreground">
              {currentRangeStart}-{currentRangeEnd}
            </span>{" "}
            of <span className="text-foreground">{sortedData.length}</span>
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Pagination>
            <PaginationContent className="flex flex-wrap justify-center gap-1 sm:gap-2">
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => setPageIndex(0)}
                  disabled={safePageIndex === 0}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon aria-hidden="true" />
                </Button>
              </PaginationItem>

              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() =>
                    setPageIndex((current) => Math.max(current - 1, 0))
                  }
                  disabled={safePageIndex === 0}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon aria-hidden="true" />
                </Button>
              </PaginationItem>

              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() =>
                    setPageIndex((current) =>
                      Math.min(current + 1, pageCount - 1)
                    )
                  }
                  disabled={safePageIndex >= pageCount - 1}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon aria-hidden="true" />
                </Button>
              </PaginationItem>

              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => setPageIndex(pageCount - 1)}
                  disabled={safePageIndex >= pageCount - 1}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}

export default DataTable
