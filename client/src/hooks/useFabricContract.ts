import { useState, useCallback } from 'react'
import { toast } from 'sonner'

/**
 * Asset envelope structure returned from chaincode
 */
export interface AssetEnvelope {
  docType: string
  tenantId: string
  assetType: string
  assetId: string
  version: number
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  deleted?: boolean
  deletedAt?: string
  deletedBy?: string
  payload: Record<string, unknown>
}

/**
 * History entry for an asset
 */
export interface AssetHistoryEntry {
  txId: string
  timestamp: {
    seconds: number
    nanos: number
  }
  isDelete: boolean
  value: AssetEnvelope | null
}

/**
 * Query result with pagination metadata
 */
export interface QueryResult {
  results: AssetEnvelope[]
  metadata: {
    recordsCount: number
    bookmark: string
  }
}

/**
 * Pagination state for queries
 */
export interface PaginationState {
  bookmark: string
  pageSize: number
}

/**
 * Custom hook for interacting with SchemaAgnosticLedger chaincode
 */
export function useFabricContract() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Call the backend API to invoke a chaincode function
   */
  const invokeChaincode = useCallback(
    async (functionName: string, args: string[]) => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/fabric/invoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            functionName,
            args,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Chaincode invocation failed')
        }

        const data = await response.json()
        return data.result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        toast.error(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  /**
   * Create or update an asset
   * @param assetType Type of the asset
   * @param assetId ID of the asset
   * @param payload Arbitrary JSON payload
   */
  const putAsset = useCallback(
    async (
      assetType: string,
      assetId: string,
      payload: Record<string, unknown>,
    ) => {
      const result = await invokeChaincode('putAsset', [
        assetType,
        assetId,
        JSON.stringify(payload),
      ])
      const envelope: AssetEnvelope = JSON.parse(result)
      toast.success(`Asset ${assetId} saved successfully`)
      return envelope
    },
    [invokeChaincode],
  )

  /**
   * Retrieve a single asset
   * @param assetType Type of the asset
   * @param assetId ID of the asset
   */
  const getAsset = useCallback(
    async (assetType: string, assetId: string) => {
      const result = await invokeChaincode('getAsset', [assetType, assetId])
      const envelope: AssetEnvelope = JSON.parse(result)
      return envelope
    },
    [invokeChaincode],
  )

  /**
   * Get the history of an asset
   * @param assetType Type of the asset
   * @param assetId ID of the asset
   */
  const getAssetHistory = useCallback(
    async (assetType: string, assetId: string) => {
      const result = await invokeChaincode('getAssetHistory', [
        assetType,
        assetId,
      ])
      const history: AssetHistoryEntry[] = JSON.parse(result)
      return history
    },
    [invokeChaincode],
  )

  /**
   * List all assets of a specific type
   * @param assetType Type of the assets
   */
  const listAssetsByType = useCallback(
    async (assetType: string) => {
      const result = await invokeChaincode('listAssetsByType', [assetType])
      const assets: AssetEnvelope[] = JSON.parse(result)
      return assets
    },
    [invokeChaincode],
  )

  /**
   * List all assets in the tenant
   */
  const listAllTenantAssets = useCallback(async () => {
    const result = await invokeChaincode('listAllTenantAssets', [])
    const assets: AssetEnvelope[] = JSON.parse(result)
    return assets
  }, [invokeChaincode])

  /**
   * Query assets using CouchDB Mango selector
   * @param selector CouchDB Mango selector
   * @param bookmark Pagination bookmark
   * @param pageSize Number of results per page
   */
  const queryAssets = useCallback(
    async (
      selector: Record<string, unknown>,
      bookmark = '',
      pageSize = 25,
    ) => {
      const result = await invokeChaincode('queryAssets', [
        JSON.stringify(selector),
        bookmark,
        pageSize.toString(),
      ])
      const queryResult: QueryResult = JSON.parse(result)
      return queryResult
    },
    [invokeChaincode],
  )

  /**
   * Delete an asset (soft delete)
   * @param assetType Type of the asset
   * @param assetId ID of the asset
   */
  const deleteAsset = useCallback(
    async (assetType: string, assetId: string) => {
      await invokeChaincode('deleteAsset', [assetType, assetId])
      toast.success(`Asset ${assetId} deleted successfully`)
    },
    [invokeChaincode],
  )

  return {
    // State
    loading,
    error,

    // Functions
    putAsset,
    getAsset,
    getAssetHistory,
    listAssetsByType,
    listAllTenantAssets,
    queryAssets,
    deleteAsset,
  }
}
