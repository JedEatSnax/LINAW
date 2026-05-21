export interface Invite {
  id: string
  organizationId: string
  tenantId?: string | null
  email: string
  role: string
  status: "pending" | "accepted" | "revoked" | "expired"
  sentAt: string | null
  expiresAt?: string | null
  acceptedAt?: string | null
  acceptedBy?: string | null
  invitedBy?: string | null
  inviteLink: string | null
  inviteLinkStatus: "available" | "accepted" | "expired" | "revoked" | "missing"
}

export interface Member {
  id: string
  userId: string
  name: string
  email: string
  role: string
  joinedAt: string | null
  status: "active" | "inactive"
  organizationId?: string | null
  tenantId?: string | null
}

export interface InviteLinkResponse {
  success: boolean
  inviteLink: string
  inviteId: string
  expiresAt?: string | null
}

export interface ApiErrorPayload {
  code?: string
  message?: string
  details?: unknown
}
