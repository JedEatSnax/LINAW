import { getAuth } from "firebase/auth"
import type { Invite, InviteLinkResponse, Member } from "@/types/member.types"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000"

export class MemberServiceError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message)
    this.name = "MemberServiceError"
    this.status = status
    this.code = code
    this.details = details
  }
}

type RawInvite = {
  id?: string
  inviteId?: string
  invite_id?: string
  organizationId?: string
  organization_id?: string
  tenantId?: string
  tenant_id?: string
  email?: string
  invitedEmail?: string
  invited_email?: string
  role?: string
  status?: Invite["status"]
  sentAt?: string | null
  created_at?: string | null
  expiresAt?: string | null
  expires_at?: string | null
  acceptedAt?: string | null
  accepted_at?: string | null
  acceptedBy?: string | null
  accepted_by?: string | null
  invitedBy?: string | null
  invited_by?: string | null
  inviteLink?: string | null
  invite_link?: string | null
  inviteLinkStatus?: Invite["inviteLinkStatus"]
}

type RawMember = {
  id?: string
  userId?: string
  user_id?: string
  name?: string
  email?: string
  user_email?: string
  role?: string
  joinedAt?: string | null
  joined_at?: string | null
  user_created_at?: string | null
  status?: Member["status"]
  organizationId?: string | null
  organization_id?: string | null
  tenantId?: string | null
  tenant_id?: string | null
}

function getLocalStorageItem(keys: string[]): string | null {
  for (const key of keys) {
    const value = localStorage.getItem(key)
    if (value) {
      return value
    }
  }

  return null
}

async function getAuthToken(): Promise<string | null> {
  const auth = getAuth()

  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken()
    } catch {
      // Fall through to localStorage keys.
    }
  }

  return (
    getLocalStorageItem([
      "authToken",
      "accessToken",
      "idToken",
      "token",
      "firebaseToken",
    ]) ?? null
  )
}

async function getOrganizationId(): Promise<string> {
  const auth = getAuth()

  if (auth.currentUser) {
    try {
      const tokenResult = await auth.currentUser.getIdTokenResult()
      const claims = tokenResult.claims as Record<string, unknown>
      const claimValue =
        (claims.organizationId as string | undefined) ??
        (claims.organization_id as string | undefined) ??
        (claims.tenantId as string | undefined) ??
        (claims.tenant_id as string | undefined)

      if (claimValue) {
        return claimValue
      }
    } catch {
      // Fall back to localStorage keys.
    }
  }

  const storageValue = getLocalStorageItem([
    "activeOrganizationId",
    "organizationId",
    "organization_id",
    "tenantId",
    "tenant_id",
  ])

  if (storageValue) {
    return storageValue
  }

  const token = await getAuthToken()
  if (token) {
    const response = await fetch(`${BACKEND_URL}/api/v1/organizations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const payload = (await response.json()) as {
        data?: Array<{ organization_id?: string }>
      }
      const firstOrganizationId = payload.data?.[0]?.organization_id

      if (firstOrganizationId) {
        localStorage.setItem("activeOrganizationId", firstOrganizationId)
        return firstOrganizationId
      }
    }
  }

  throw new MemberServiceError(
    "Organization context is not available for the current session",
    400,
    "ORGANIZATION_CONTEXT_REQUIRED"
  )
}

function normalizeInvite(invite: RawInvite): Invite {
  const id = invite.id ?? invite.inviteId ?? invite.invite_id ?? ""
  const email = invite.email ?? invite.invitedEmail ?? invite.invited_email ?? ""

  return {
    id,
    organizationId: invite.organizationId ?? invite.organization_id ?? "",
    tenantId: invite.tenantId ?? invite.tenant_id ?? null,
    email,
    role: invite.role ?? "member",
    status: invite.status ?? "pending",
    sentAt: invite.sentAt ?? invite.created_at ?? null,
    expiresAt: invite.expiresAt ?? invite.expires_at ?? null,
    acceptedAt: invite.acceptedAt ?? invite.accepted_at ?? null,
    acceptedBy: invite.acceptedBy ?? invite.accepted_by ?? null,
    invitedBy: invite.invitedBy ?? invite.invited_by ?? null,
    inviteLink: invite.inviteLink ?? invite.invite_link ?? null,
    inviteLinkStatus: invite.inviteLinkStatus ?? "missing",
  }
}

function normalizeMember(member: RawMember): Member {
  const id = member.id ?? member.userId ?? member.user_id ?? ""
  const email = member.email ?? member.user_email ?? ""

  return {
    id,
    userId: member.userId ?? member.user_id ?? id,
    name: member.name ?? (email ? email.split("@")[0] : "Member"),
    email,
    role: member.role ?? "member",
    joinedAt: member.joinedAt ?? member.joined_at ?? member.user_created_at ?? null,
    status: member.status ?? "active",
    organizationId: member.organizationId ?? member.organization_id ?? null,
    tenantId: member.tenantId ?? member.tenant_id ?? null,
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()

  const response = await fetch(`${BACKEND_URL}/api/v1${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  const payload = await response
    .json()
    .catch(() => null as Record<string, unknown> | null)

  if (!response.ok) {
    const errorPayload = payload as { error?: { message?: string; code?: string; details?: unknown }; message?: string }
    const message =
      errorPayload?.error?.message ??
      errorPayload?.message ??
      `Request failed (${response.status} ${response.statusText})`

    throw new MemberServiceError(
      message,
      response.status,
      errorPayload?.error?.code,
      errorPayload?.error?.details
    )
  }

  return payload as T
}

function readInviteCache(organizationId: string): Invite[] {
  try {
    const raw = localStorage.getItem(`linaw:member-invites:${organizationId}`)
    return raw ? (JSON.parse(raw) as Invite[]) : []
  } catch {
    return []
  }
}

function writeInviteCache(organizationId: string, invites: Invite[]) {
  localStorage.setItem(`linaw:member-invites:${organizationId}`, JSON.stringify(invites))
}

function readMemberCache(organizationId: string): Member[] {
  try {
    const raw = localStorage.getItem(`linaw:members:${organizationId}`)
    return raw ? (JSON.parse(raw) as Member[]) : []
  } catch {
    return []
  }
}

function writeMemberCache(organizationId: string, members: Member[]) {
  localStorage.setItem(`linaw:members:${organizationId}`, JSON.stringify(members))
}

export async function getPendingInvites(): Promise<Invite[]> {
  const organizationId = await getOrganizationId()

  try {
    const response = await requestJson<{ success?: boolean; data?: RawInvite[] }>(
      `/organizations/${organizationId}/invitations`
    )

    const invites = (response.data ?? []).map(normalizeInvite)
    const cache = readInviteCache(organizationId)
    const cachedById = new Map(cache.map((invite) => [invite.id, invite]))
    const hydrated = invites.map((invite) => ({ ...invite, inviteLink: cachedById.get(invite.id)?.inviteLink ?? invite.inviteLink }))

    writeInviteCache(organizationId, hydrated)
    return hydrated
  } catch {
    return readInviteCache(organizationId)
  }
}

export async function getAcceptedMembers(): Promise<Member[]> {
  const organizationId = await getOrganizationId()

  try {
    const response = await requestJson<{ success?: boolean; data?: RawMember[] }>(
      `/organizations/${organizationId}/members`
    )

    const members = (response.data ?? []).map(normalizeMember)
    writeMemberCache(organizationId, members)
    return members
  } catch {
    return readMemberCache(organizationId)
  }
}

export async function generateInviteLink(params: {
  email: string
  role: string
}): Promise<InviteLinkResponse & { invite: Invite }> {
  const organizationId = await getOrganizationId()

  const response = await requestJson<{
    success?: boolean
    data?: {
      inviteId?: string
      organizationId?: string
      invitedEmail?: string
      role?: string
      status?: Invite["status"]
      expiresAt?: string | null
      inviteLink?: string
    }
  }>(`/organizations/${organizationId}/invitations`, {
    method: "POST",
    body: JSON.stringify({
      organization_id: organizationId,
      invitedEmail: params.email,
      role: params.role,
    }),
  })

  const invite = normalizeInvite({
    id: response.data?.inviteId,
    organizationId: response.data?.organizationId ?? organizationId,
    invitedEmail: response.data?.invitedEmail ?? params.email,
    role: response.data?.role ?? params.role,
    status: response.data?.status ?? "pending",
    expiresAt: response.data?.expiresAt ?? null,
    inviteLink: response.data?.inviteLink ?? null,
    inviteLinkStatus: response.data?.inviteLink ? "available" : "missing",
  })

  const cache = readInviteCache(organizationId)
  const nextInvites = [invite, ...cache.filter((item) => item.id !== invite.id)]
  writeInviteCache(organizationId, nextInvites)

  return {
    success: true,
    inviteLink: response.data?.inviteLink ?? "",
    inviteId: response.data?.inviteId ?? invite.id,
    expiresAt: response.data?.expiresAt ?? null,
    invite,
  }
}

export async function resendInvite(inviteId: string): Promise<InviteLinkResponse & { invite: Invite }> {
  const organizationId = await getOrganizationId()
  const response = await requestJson<{
    success?: boolean
    data?: {
      inviteId?: string
      inviteLink?: string
      expiresAt?: string | null
      invitedEmail?: string
      role?: string
      status?: Invite["status"]
    }
  }>(`/organizations/${organizationId}/invitations/${inviteId}/resend`, {
    method: "POST",
  })

  const invite = normalizeInvite({
    id: response.data?.inviteId ?? inviteId,
    organizationId,
    invitedEmail: response.data?.invitedEmail ?? "",
    role: response.data?.role ?? "member",
    status: response.data?.status ?? "pending",
    expiresAt: response.data?.expiresAt ?? null,
    inviteLink: response.data?.inviteLink ?? null,
    inviteLinkStatus: response.data?.inviteLink ? "available" : "missing",
  })

  const cache = readInviteCache(organizationId)
  const nextInvites = [invite, ...cache.filter((item) => item.id !== invite.id)]
  writeInviteCache(organizationId, nextInvites)

  return {
    success: true,
    inviteLink: response.data?.inviteLink ?? "",
    inviteId: invite.id,
    expiresAt: response.data?.expiresAt ?? null,
    invite,
  }
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const organizationId = await getOrganizationId()
  await requestJson<{ success?: boolean }>(`/organizations/${organizationId}/invitations/${inviteId}`, {
    method: "DELETE",
  })

  const cache = readInviteCache(organizationId)
  writeInviteCache(organizationId, cache.filter((invite) => invite.id !== inviteId))
}

export async function removeMember(userId: string): Promise<void> {
  const organizationId = await getOrganizationId()
  await requestJson<{ success?: boolean }>(`/organizations/${organizationId}/members/${userId}`, {
    method: "DELETE",
  })

  const cache = readMemberCache(organizationId)
  writeMemberCache(organizationId, cache.filter((member) => member.userId !== userId && member.id !== userId))
}

export async function resolveOrganizationId(): Promise<string> {
  return getOrganizationId()
}
