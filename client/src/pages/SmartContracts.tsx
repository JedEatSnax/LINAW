import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useFabricContract, type AssetEnvelope, type AssetHistoryEntry } from "@/hooks/useFabricContract"
import { type CSSProperties, useState, useEffect } from "react"
import { Loader2, Trash2, History, Plus } from "lucide-react"
import { toast } from "sonner"

export default function SmartContract() {
  const {
    loading,
    error,
    putAsset,
    getAsset,
    getAssetHistory,
    listAssetsByType,
    listAllTenantAssets,
    queryAssets,
    deleteAsset,
  } = useFabricContract()

  // State for Create/Update Asset
  const [assetType, setAssetType] = useState("")
  const [assetId, setAssetId] = useState("")
  const [payload, setPayload] = useState("{}")
  const [isCreating, setIsCreating] = useState(false)

  // State for View/Search
  const [viewAssetType, setViewAssetType] = useState("")
  const [viewAssetId, setViewAssetId] = useState("")
  const [selectedAsset, setSelectedAsset] = useState<AssetEnvelope | null>(null)
  const [assetHistory, setAssetHistory] = useState<AssetHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // State for List Assets
  const [listType, setListType] = useState("")
  const [assets, setAssets] = useState<AssetEnvelope[]>([])

  // State for Query
  const [querySelector, setQuerySelector] = useState("{}")
  const [queryResults, setQueryResults] = useState<AssetEnvelope[]>([])

  // Handle Create/Update Asset
  const handlePutAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetType || !assetId) {
      toast.error("Asset Type and ID are required")
      return
    }

    try {
      let payloadObj: Record<string, unknown>
      try {
        payloadObj = JSON.parse(payload)
      } catch {
        toast.error("Invalid JSON in payload")
        return
      }

      setIsCreating(true)
      await putAsset(assetType, assetId, payloadObj)
      setAssetType("")
      setAssetId("")
      setPayload("{}")
    } finally {
      setIsCreating(false)
    }
  }

  // Handle View Asset
  const handleGetAsset = async () => {
    if (!viewAssetType || !viewAssetId) {
      toast.error("Asset Type and ID are required")
      return
    }

    try {
      const asset = await getAsset(viewAssetType, viewAssetId)
      setSelectedAsset(asset)
      setShowHistory(false)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Get Asset History
  const handleGetAssetHistory = async () => {
    if (!viewAssetType || !viewAssetId) {
      toast.error("Asset Type and ID are required")
      return
    }

    try {
      const history = await getAssetHistory(viewAssetType, viewAssetId)
      setAssetHistory(history)
      setShowHistory(true)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle List Assets by Type
  const handleListAssetsByType = async () => {
    if (!listType) {
      toast.error("Asset Type is required")
      return
    }

    try {
      const result = await listAssetsByType(listType)
      setAssets(result)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle List All Tenant Assets
  const handleListAllTenantAssets = async () => {
    try {
      const result = await listAllTenantAssets()
      setAssets(result)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Query Assets
  const handleQueryAssets = async () => {
    try {
      let selectorObj: Record<string, unknown>
      try {
        selectorObj = JSON.parse(querySelector)
      } catch {
        toast.error("Invalid JSON in query selector")
        return
      }

      const result = await queryAssets(selectorObj)
      setQueryResults(result.results)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Delete Asset
  const handleDeleteAsset = async (type: string, id: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete asset ${id}? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteAsset(type, id)
        if (selectedAsset?.assetId === id) {
          setSelectedAsset(null)
        }
        setAssets(assets.filter((a) => a.assetId !== id))
      } catch (err) {
        console.error(err)
      }
    }
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
        <SiteHeader title="Smart Contracts" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="create">Create</TabsTrigger>
                  <TabsTrigger value="view">View</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                  <TabsTrigger value="query">Query</TabsTrigger>
                  <TabsTrigger value="help">Help</TabsTrigger>
                </TabsList>

                {/* Create/Update Asset Tab */}
                <TabsContent value="create" className="space-y-4">
                  <div className="rounded-lg border p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      Create or Update Asset
                    </h2>
                    <form onSubmit={handlePutAsset} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="asset-type">Asset Type</Label>
                          <Input
                            id="asset-type"
                            placeholder="e.g., invoice, product, order"
                            value={assetType}
                            onChange={(e) => setAssetType(e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="asset-id">Asset ID</Label>
                          <Input
                            id="asset-id"
                            placeholder="e.g., INV-001"
                            value={assetId}
                            onChange={(e) => setAssetId(e.target.value)}
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payload">JSON Payload</Label>
                        <textarea
                          id="payload"
                          placeholder='{"name": "value", "amount": 100}'
                          value={payload}
                          onChange={(e) => setPayload(e.target.value)}
                          disabled={loading}
                          rows={8}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Save Asset
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </TabsContent>

                {/* View Asset Tab */}
                <TabsContent value="view" className="space-y-4">
                  <div className="rounded-lg border p-6 space-y-4">
                    <h2 className="text-lg font-semibold">View Asset</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="view-asset-type">Asset Type</Label>
                        <Input
                          id="view-asset-type"
                          placeholder="e.g., invoice"
                          value={viewAssetType}
                          onChange={(e) => setViewAssetType(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="view-asset-id">Asset ID</Label>
                        <Input
                          id="view-asset-id"
                          placeholder="e.g., INV-001"
                          value={viewAssetId}
                          onChange={(e) => setViewAssetId(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleGetAsset} disabled={loading}>
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Get Asset
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleGetAssetHistory}
                        disabled={loading}
                      >
                        <History className="mr-2 h-4 w-4" />
                        View History
                      </Button>
                    </div>

                    {selectedAsset && !showHistory && (
                      <div className="mt-6 space-y-4">
                        <h3 className="font-semibold">Asset Details</h3>
                        <div className="rounded-md bg-muted p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Asset ID:</span>{" "}
                              {selectedAsset.assetId}
                            </div>
                            <div>
                              <span className="font-medium">Type:</span>{" "}
                              {selectedAsset.assetType}
                            </div>
                            <div>
                              <span className="font-medium">Version:</span>{" "}
                              {selectedAsset.version}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span>{" "}
                              {new Date(
                                selectedAsset.createdAt,
                              ).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Updated:</span>{" "}
                              {new Date(
                                selectedAsset.updatedAt,
                              ).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Status:</span>{" "}
                              <Badge variant={selectedAsset.deleted ? "destructive" : "default"}>
                                {selectedAsset.deleted ? "Deleted" : "Active"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <h3 className="font-semibold mt-4">Payload</h3>
                        <pre className="rounded-md bg-muted p-4 overflow-auto text-sm">
                          {JSON.stringify(selectedAsset.payload, null, 2)}
                        </pre>

                        {!selectedAsset.deleted && (
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleDeleteAsset(
                                selectedAsset.assetType,
                                selectedAsset.assetId,
                              )
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Asset
                          </Button>
                        )}
                      </div>
                    )}

                    {showHistory && assetHistory.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <h3 className="font-semibold">Asset History</h3>
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assetHistory.map((entry, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-mono text-xs">
                                    {entry.txId.substring(0, 16)}...
                                  </TableCell>
                                  <TableCell>
                                    {new Date(
                                      entry.timestamp.seconds * 1000,
                                    ).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        entry.isDelete
                                          ? "destructive"
                                          : "default"
                                      }
                                    >
                                      {entry.isDelete ? "Delete" : "Update"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* List Assets Tab */}
                <TabsContent value="list" className="space-y-4">
                  <div className="rounded-lg border p-6 space-y-4">
                    <h2 className="text-lg font-semibold">List Assets</h2>

                    <div className="space-y-2">
                      <Label htmlFor="list-type">Asset Type (optional)</Label>
                      <Input
                        id="list-type"
                        placeholder="Leave empty to list all tenant assets"
                        value={listType}
                        onChange={(e) => setListType(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleListAssetsByType}
                        disabled={loading || !listType}
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        List by Type
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleListAllTenantAssets}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        List All Tenant Assets
                      </Button>
                    </div>

                    {assets.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-4">
                          Results ({assets.length})
                        </h3>
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Asset ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assets.map((asset) => (
                                <TableRow
                                  key={`${asset.assetType}-${asset.assetId}`}
                                  className="cursor-pointer hover:bg-muted"
                                  onClick={() => {
                                    setViewAssetType(asset.assetType)
                                    setViewAssetId(asset.assetId)
                                    setSelectedAsset(asset)
                                  }}
                                >
                                  <TableCell className="font-medium">
                                    {asset.assetId}
                                  </TableCell>
                                  <TableCell>{asset.assetType}</TableCell>
                                  <TableCell>{asset.version}</TableCell>
                                  <TableCell>
                                    {new Date(
                                      asset.updatedAt,
                                    ).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        asset.deleted
                                          ? "destructive"
                                          : "default"
                                      }
                                    >
                                      {asset.deleted ? "Deleted" : "Active"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Query Assets Tab */}
                <TabsContent value="query" className="space-y-4">
                  <div className="rounded-lg border p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Query Assets</h2>
                    <p className="text-sm text-muted-foreground">
                      Use CouchDB Mango selector syntax. Note: tenantId is automatically injected.
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="query-selector">Mango Selector</Label>
                      <textarea
                        id="query-selector"
                        placeholder='{"assetType": "invoice", "payload.amount": {"$gt": 100}}'
                        value={querySelector}
                        onChange={(e) => setQuerySelector(e.target.value)}
                        disabled={loading}
                        rows={8}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <Button onClick={handleQueryAssets} disabled={loading}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Execute Query
                    </Button>

                    {queryResults.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-4">
                          Results ({queryResults.length})
                        </h3>
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Asset ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {queryResults.map((asset) => (
                                <TableRow
                                  key={`${asset.assetType}-${asset.assetId}`}
                                  className="cursor-pointer hover:bg-muted"
                                  onClick={() => {
                                    setViewAssetType(asset.assetType)
                                    setViewAssetId(asset.assetId)
                                    setSelectedAsset(asset)
                                  }}
                                >
                                  <TableCell className="font-medium">
                                    {asset.assetId}
                                  </TableCell>
                                  <TableCell>{asset.assetType}</TableCell>
                                  <TableCell>{asset.version}</TableCell>
                                  <TableCell>
                                    {new Date(
                                      asset.updatedAt,
                                    ).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        asset.deleted
                                          ? "destructive"
                                          : "default"
                                      }
                                    >
                                      {asset.deleted ? "Deleted" : "Active"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Help Tab */}
                <TabsContent value="help" className="space-y-4">
                  <div className="rounded-lg border p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Help & Documentation</h2>

                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">Create Tab</h3>
                        <p className="text-sm text-muted-foreground">
                          Create or update assets in the ledger. Provide an asset
                          type, unique ID, and arbitrary JSON payload.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">View Tab</h3>
                        <p className="text-sm text-muted-foreground">
                          Retrieve a specific asset by type and ID. View its
                          metadata, payload, and complete transaction history.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">List Tab</h3>
                        <p className="text-sm text-muted-foreground">
                          List all assets of a specific type, or all assets
                          belonging to your tenant.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Query Tab</h3>
                        <p className="text-sm text-muted-foreground">
                          Advanced querying using CouchDB Mango selectors.
                          Build complex queries with filters, comparisons, and
                          logical operators.
                        </p>
                      </div>

                      <div className="rounded-md bg-blue-50 p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Example Query
                        </h4>
                        <pre className="text-xs text-blue-800 overflow-auto">
{`{
  "assetType": "invoice",
  "payload.amount": { "$gt": 1000 },
  "payload.status": "pending"
}`}
                        </pre>
                      </div>

                      <div className="text-xs text-muted-foreground border-t pt-4">
                        <p>
                          <strong>Note:</strong> Your tenant ID is automatically
                          resolved from your certificate. You cannot access assets
                          from other tenants.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
