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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Eye, Settings } from "lucide-react"

interface Network {
  network_id: number
  network_name: string
  status: "active" | "starting" | "stopped"
  organizations: string[]
  consensus: "etcdraft" | "solo"
  channelId: string
  ordererCount: number
  created_at: string
}

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  starting: { label: "Starting", color: "bg-yellow-100 text-yellow-800" },
  stopped: { label: "Stopped", color: "bg-gray-100 text-gray-800" },
}

export default function BlockchainNetworks() {
  const [networks, setNetworks] = useState<Network[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingNetwork, setViewingNetwork] = useState<Network | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    networkName: "",
    consensus: "etcdraft",
    channelId: "mychannel",
    ordererCount: "3" as "1" | "3" | "5",
    organizations: [] as string[],
    orgName: "",
  })


  // Load networks on mount
  useEffect(() => {
    const loadNetworks = async () => {
      setLoading(true)
      setError(null)
      try {
        // Mock data for demo
        setNetworks([
          {
            network_id: 1,
            network_name: "production-network",
            status: "active",
            organizations: ["Org1", "Org2", "Org3"],
            consensus: "etcdraft",
            channelId: "mainchannel",
            ordererCount: 3,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            network_id: 2,
            network_name: "test-network",
            status: "active",
            organizations: ["TestOrg1"],
            consensus: "solo",
            channelId: "mychannel",
            ordererCount: 1,
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            network_id: 3,
            network_name: "staging-network",
            status: "starting",
            organizations: ["StagingOrg1", "StagingOrg2"],
            consensus: "etcdraft",
            channelId: "stagingchannel",
            ordererCount: 3,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load networks")
      } finally {
        setLoading(false)
      }
    }

    loadNetworks()
  }, [])

  const handleAddOrganization = () => {
    if (formData.orgName.trim()) {
      setFormData((prev) => ({
        ...prev,
        organizations: [...prev.organizations, prev.orgName],
        orgName: "",
      }))
    }
  }

  const handleRemoveOrganization = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      organizations: prev.organizations.filter((_, i) => i !== index),
    }))
  }

  const handleCreateNetwork = async () => {
    try {
      setError(null)
      if (!formData.networkName) {
        setError("Network name is required")
        return
      }
      if (formData.organizations.length === 0) {
        setError("At least one organization is required")
        return
      }

      const newNetwork: Network = {
        network_id: Math.max(...networks.map((n) => n.network_id), 0) + 1,
        network_name: formData.networkName,
        status: "starting",
        organizations: formData.organizations,
        consensus: formData.consensus as "etcdraft" | "solo",
        channelId: formData.channelId,
        ordererCount: parseInt(formData.ordererCount),
        created_at: new Date().toISOString(),
      }

      setNetworks((prev) => [newNetwork, ...prev])
      setFormData({
        networkName: "",
        consensus: "etcdraft",
        channelId: "mychannel",
        ordererCount: "3",
        organizations: [],
        orgName: "",
      })
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create network")
    }
  }

  const handleDeleteNetwork = (networkId: number) => {
    if (!confirm("Are you sure you want to delete this network?")) return
    setNetworks((prev) => prev.filter((n) => n.network_id !== networkId))
    if (viewingNetwork?.network_id === networkId) {
      setViewingNetwork(null)
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
        <SiteHeader title="Blockchain Networks" />
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Blockchain Networks</h1>
              <p className="text-muted-foreground mt-1">
                Manage Hyperledger Fabric networks and infrastructure
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Network
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <form onSubmit={(e) => { e.preventDefault(); void handleCreateNetwork(); }} noValidate>
                  <DialogHeader>
                    <DialogTitle>Create New Blockchain Network</DialogTitle>
                    <DialogDescription>Configure and deploy a new Hyperledger Fabric network</DialogDescription>
                  </DialogHeader>

                  <FieldGroup className="gap-4 py-4">
                  <Field>
                    <Label htmlFor="network-name">Network Name *</Label>
                    <Input
                      id="network-name"
                      placeholder="e.g., production-network"
                      value={formData.networkName}
                      onChange={(e) =>
                        setFormData({ ...formData, networkName: e.target.value })
                      }
                    />
                    <FieldDescription>3-50 alphanumeric characters</FieldDescription>
                  </Field>

                  <Field>
                    <Label htmlFor="consensus">Consensus Mechanism *</Label>
                    <Select
                      value={formData.consensus}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          consensus: value as "etcdraft" | "solo",
                        })
                      }
                    >
                      <SelectTrigger id="consensus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="etcdraft">etcdraft (Recommended)</SelectItem>
                        <SelectItem value="solo">Solo (Dev Only)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>etcdraft for production, solo for testing</FieldDescription>
                  </Field>

                  <Field>
                    <Label htmlFor="orderer-count">Orderer Count *</Label>
                    <Select
                      value={formData.ordererCount}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ordererCount: value as "1" | "3" | "5" })
                      }
                    >
                      <SelectTrigger id="orderer-count">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Orderer</SelectItem>
                        <SelectItem value="3">3 Orderers</SelectItem>
                        <SelectItem value="5">5 Orderers</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Higher count for better fault tolerance</FieldDescription>
                  </Field>

                  <Field>
                    <Label htmlFor="channel-id">Channel ID *</Label>
                    <Input
                      id="channel-id"
                      placeholder="e.g., mychannel"
                      value={formData.channelId}
                      onChange={(e) =>
                        setFormData({ ...formData, channelId: e.target.value })
                      }
                    />
                    <FieldDescription>Initial channel name</FieldDescription>
                  </Field>

                  <Field>
                    <Label htmlFor="org-input">Organizations *</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="org-input"
                          placeholder="Organization name"
                          value={formData.orgName}
                          onChange={(e) =>
                            setFormData({ ...formData, orgName: e.target.value })
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddOrganization()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddOrganization}
                        >
                          Add
                        </Button>
                      </div>

                      <div className="space-y-1">
                        {formData.organizations.map((org, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm font-medium">{org}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOrganization(index)}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <FieldDescription>
                      At least one organization required (e.g., Org1MSP)
                    </FieldDescription>
                  </Field>

                    {error ? (
                      <div className="max-h-28 overflow-y-auto rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm whitespace-pre-wrap text-red-700">{error}</div>
                    ) : null}
                  </FieldGroup>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Create Network</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {error && !isDialogOpen && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700 text-sm">{error}</div>
          )}

          <div className="rounded-lg border bg-card text-card-foreground">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading networks...</p>
              </div>
            ) : networks.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">No networks found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Organizations</TableHead>
                    <TableHead>Consensus</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networks.map((network) => (
                    <TableRow key={network.network_id}>
                      <TableCell className="font-medium">{network.network_name}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_CONFIG[network.status].color}>
                          {STATUS_CONFIG[network.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {network.organizations.map((org, idx) => (
                            <Badge key={idx} variant="outline">
                              {org}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{network.consensus}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(network.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingNetwork(network)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNetwork(network.network_id)}
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

          {/* Network Detail Dialog */}
          <Dialog open={!!viewingNetwork} onOpenChange={() => setViewingNetwork(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{viewingNetwork?.network_name}</DialogTitle>
              </DialogHeader>

              {viewingNetwork && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={STATUS_CONFIG[viewingNetwork.status].color}>
                        {STATUS_CONFIG[viewingNetwork.status].label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Consensus</p>
                      <p className="font-medium capitalize">{viewingNetwork.consensus}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Channel ID</p>
                      <p className="font-medium">{viewingNetwork.channelId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Orderers</p>
                      <p className="font-medium">{viewingNetwork.ordererCount}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Organizations
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {viewingNetwork.organizations.map((org, idx) => (
                          <Badge key={idx} variant="outline">
                            {org}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
