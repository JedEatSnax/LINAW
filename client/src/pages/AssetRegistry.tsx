import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffect, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
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
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Edit2, Plus } from "lucide-react"

interface Asset {
  id: string
  color: string
  size: number
  owner: string
  appraisedValue: number
  created_at?: string
}

export default function AssetRegistry() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  // Form state
  const [formData, setFormData] = useState<Omit<Asset, "created_at">>({
    id: "",
    color: "",
    size: 0,
    owner: "",
    appraisedValue: 0,
  })

  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000"

  // Load assets on mount
  useEffect(() => {
    const loadAssets = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${backendUrl}/api/v1/assets`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to load assets: ${response.statusText}`)
        }

        const data = await response.json()
        setAssets(Array.isArray(data.data) ? data.data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assets")
        // Mock data for demo
        setAssets([
          {
            id: "ASSET-001",
            color: "Blue",
            size: 150,
            owner: "John Doe",
            appraisedValue: 50000,
            created_at: new Date().toISOString(),
          },
          {
            id: "ASSET-002",
            color: "Red",
            size: 200,
            owner: "Jane Smith",
            appraisedValue: 75000,
            created_at: new Date().toISOString(),
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    loadAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateOrUpdate = async () => {
    try {
      setError(null)
      if (!formData.color || !formData.owner) {
        setError("Please fill in all required fields")
        return
      }

      if (editingAsset) {
        // Update existing asset
        const response = await fetch(`${backendUrl}/api/v1/assets/${editingAsset.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error("Failed to update asset")
        }

        // Update local state
        setAssets((prev) =>
          prev.map((a) =>
            a.id === editingAsset.id ? { ...a, ...formData } : a
          )
        )
      } else {
        // Create new asset
        const response = await fetch(`${backendUrl}/api/v1/assets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error("Failed to create asset")
        }

        const newAsset = await response.json()
        setAssets((prev) => [...prev, newAsset.data])
      }

      // Reset form
      setFormData({ id: "", color: "", size: 0, owner: "", appraisedValue: 0 })
      setEditingAsset(null)
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed")
    }
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setFormData({
      id: asset.id,
      color: asset.color,
      size: asset.size,
      owner: asset.owner,
      appraisedValue: asset.appraisedValue,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return

    try {
      setError(null)
      const response = await fetch(`${backendUrl}/api/v1/assets/${assetId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete asset")
      }

      setAssets((prev) => prev.filter((a) => a.id !== assetId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete asset")
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingAsset(null)
    setFormData({ id: "", color: "", size: 0, owner: "", appraisedValue: 0 })
    setError(null)
  }

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
        <SiteHeader title="Asset Registry" />
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Asset Registry</h1>
              <p className="text-muted-foreground mt-1">
                Manage and track your blockchain assets
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingAsset(null)
                    setFormData({ id: "", color: "", size: 0, owner: "", appraisedValue: 0 })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Asset
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <form onSubmit={(e) => { e.preventDefault(); void handleCreateOrUpdate(); }} noValidate>
                  <DialogHeader>
                    <DialogTitle>{editingAsset ? "Edit Asset" : "Create New Asset"}</DialogTitle>
                    <DialogDescription>
                      {editingAsset ? "Update the asset details below" : "Fill in the details to create a new asset"}
                    </DialogDescription>
                  </DialogHeader>

                  <FieldGroup className="gap-4 py-4">
                    <Field>
                      <Label htmlFor="asset-id">Asset ID (Optional)</Label>
                      <Input
                        id="asset-id"
                        placeholder="e.g., ASSET-001"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        disabled={!!editingAsset}
                      />
                      <FieldDescription>Auto-generated if left empty</FieldDescription>
                    </Field>

                    <Field>
                      <Label htmlFor="color">Color *</Label>
                      <Input id="color" placeholder="e.g., Blue" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} required />
                    </Field>

                    <Field>
                      <Label htmlFor="size">Size *</Label>
                      <Input id="size" type="number" placeholder="e.g., 150" value={formData.size} onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) || 0 })} required />
                    </Field>

                    <Field>
                      <Label htmlFor="owner">Owner *</Label>
                      <Input id="owner" placeholder="e.g., John Doe" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} required />
                    </Field>

                    <Field>
                      <Label htmlFor="value">Appraised Value (USD) *</Label>
                      <Input id="value" type="number" placeholder="e.g., 50000" value={formData.appraisedValue} onChange={(e) => setFormData({ ...formData, appraisedValue: parseInt(e.target.value) || 0 })} required />
                    </Field>

                    {error ? (
                      <div className="max-h-28 overflow-y-auto rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm whitespace-pre-wrap text-red-700">
                        {error}
                      </div>
                    ) : null}
                  </FieldGroup>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button" onClick={handleDialogClose}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit">{editingAsset ? "Update Asset" : "Create Asset"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {error && !isDialogOpen && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="rounded-lg border bg-card text-card-foreground">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading assets...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">No assets found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Appraised Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.id}</TableCell>
                      <TableCell>{asset.color}</TableCell>
                      <TableCell>{asset.size}</TableCell>
                      <TableCell>{asset.owner}</TableCell>
                      <TableCell>${asset.appraisedValue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(asset)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(asset.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
