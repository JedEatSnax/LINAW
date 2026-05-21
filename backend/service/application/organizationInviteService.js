const crypto = require("node:crypto")
const AppError = require("../../utils/AppError")

const organizationDao = require("../../dao/organizations/organizationDao");
const organizationUserDao = require("../../dao/organizations/organziationUserDao");
const organizationInviteDao = require("../../dao/organizations/organizationInviteDao");
const userDao = require("../../dao/userDao");

function buildInviteLink(rawToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    return `${frontendUrl}/invitations/accept?token=${rawToken}`
}

function toIsoDate(value) {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function formatInvite(invite) {
    if (!invite) return null

    return {
        id: invite.invite_id,
        organizationId: invite.organization_id,
        tenantId: invite.tenant_id,
        email: invite.invited_email,
        role: invite.role,
        status: invite.status,
        sentAt: toIsoDate(invite.created_at),
        expiresAt: toIsoDate(invite.expires_at),
        acceptedAt: toIsoDate(invite.accepted_at),
        acceptedBy: invite.accepted_by || null,
        invitedBy: invite.invited_by || null,
        inviteLink: null,
        inviteLinkStatus:
            invite.status === 'pending' && (!invite.expires_at || new Date(invite.expires_at) > new Date())
                ? 'available'
                : invite.status === 'accepted'
                    ? 'accepted'
                    : 'expired',
    }
}

function formatMember(member) {
    if (!member) return null

    const joinedAt = member.accepted_at || member.user_created_at || null
    const email = member.user_email || null

    return {
        id: member.user_id,
        userId: member.user_id,
        name: email ? email.split('@')[0] : 'Member',
        email,
        role: member.role,
        joinedAt: toIsoDate(joinedAt),
        status: 'active',
        organizationId: member.organization_id,
        tenantId: member.tenant_id,
    }
}

class organizationInviteService {
    async assertManageAccess({ organization_id, tenant_id, firebaseUid }) {
        if (!firebaseUid) {
            throw new AppError('Authentication required', 401, 'UNAUTHORIZED')
        }

        const dbUser = await userDao.findByFirebaseUid(firebaseUid)
        if (!dbUser) {
            throw new AppError('Authenticated user not found in database', 404, 'USER_NOT_FOUND')
        }

        const membership = await organizationUserDao.findByOrganizationAndUser({
            organization_id,
            user_id: dbUser.user_id,
            tenant_id,
        })

        if (!membership) {
            throw new AppError('You are not a member of this organization', 403, 'NOT_ORGANIZATION_MEMBER')
        }

        return { dbUser, membership }
    }

    async listOrganizations({ tenant_id, firebaseUid }) {
        if (!firebaseUid) {
            throw new AppError('Authentication required', 401, 'UNAUTHORIZED')
        }

        const dbUser = await userDao.findByFirebaseUid(firebaseUid)
        if (!dbUser) {
            throw new AppError('Authenticated user not found in database', 404, 'USER_NOT_FOUND')
        }

        const organizations = await organizationDao.getOrganizationsByTenant(tenant_id)

        return {
            success: true,
            data: organizations.map((organization) => ({
                organization_id: organization.organization_id,
                organization_name: organization.organization_name,
                tenant_id: organization.tenant_id,
                msp_id: organization.msp_id,
                created_at: organization.created_at,
                updated_at: organization.updated_at,
            })),
        }
    }

    async createInvite ({ organization_id, invitedEmail, role, invitedByUserId, tenant_id}){
        const normalizedEmail = String(invitedEmail).trim().toLowerCase()
        const normalizedRole = String(role).trim().toLowerCase()

        const organization = await organizationDao.findById({
            organization_id,
            tenant_id
        })

        if(!organization){
            throw new AppError ("Organization not found", 404, "ORGANIZATION_NOT_FOUND")
        }

        const invitedMembership = await organizationUserDao.findByOrganizationAndUser({
            organization_id,
            user_id: invitedByUserId,
            tenant_id
        })

        if (!invitedMembership) {
            throw new AppError ("You are not a member of this organization", 403, "NOT_ORGANIZATION_MEMBER")
        }

        if(!['owner', 'admin'].includes(invitedMembership.role)) {
            throw new AppError ("You are not allowed to invite members", 403, "INSUFFICIENT_ORG_PERMISSION")
        }

        const existingUser = await userDao.findUserByEmail(normalizedEmail)

        if(existingUser) {
            const existingMembership = await organizationUserDao.findByOrganizationAndUser({
                organization_id,
                user_id: existingUser.user_id,
                tenant_id
            })
            
            if (existingMembership) {
                throw new AppError ("User is already an organization member", 409, "ALREADY_ORGANIZATION_MEMBER")
            }
        }

        const activeInvite = await organizationInviteDao.findActiveByOrganizationAndEmail({
            organization_id,
            invited_email: normalizedEmail,
            tenant_id
        })

        if (activeInvite) {
            throw new AppError ("Active invitation already exists for this email", 409, "INVITE_ALREADY_EXISTS")
        }

        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)

        const invite = await organizationInviteDao.create({
            tenant_id,
            organization_id,
            invited_email: normalizedEmail,
            role: normalizedRole,
            token_hash: tokenHash,
            status: 'pending',
            expires_at: expiresAt,
            invited_by: invitedByUserId,
        })

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
        const inviteLink = `${frontendUrl}/invitations/accept?token=${rawToken}`

        return {
            success: true,
            message: " Invitation created successfully",
            data: {
                inviteId: invite.invite_id,
                organizationId: organization_id,
                invitedEmail: normalizedEmail,
                role: normalizedRole,
                status: invite.status,
                expiresAt,
                inviteLink,
            }
        }

    }

    async getInviteByToken (token) {
        const normalizedToken = String(token || '').trim()

        if(!normalizedToken) {
            throw new AppError ("Invitation token is required", 400, "INVITATION_TOKEN_REQUIRED")
        }

        const tokenHash = crypto.createHash('sha256').update(normalizedToken).digest('hex')

        const invite = await organizationInviteDao.findByTokenHash(tokenHash)

        if(!invite){
            throw new AppError ("Invitation not found", 404, "INVITATION_NOT_FOUND")
        }

        if (invite.status !== 'pending'){
            throw new AppError ("Invitation is no longer valid", 409, "INVITATION_NOT_ACTIVE")
        }

        if (new Date(invite.expires_at) < new Date()){
            throw new AppError ("Invitation has expired", 410, "INVITATION_EXPIRED")
        }

        return {
            success: true,
            message: "Invitation retrieved successfully",
            data: invite
        }

    }

    async acceptInvite({token, user_id, tenant_id}){
        const normalizedToken = String(token || '').trim()

        if (!normalizedToken) {
            throw new AppError("Invitation token is required", 400, "INVITATION_TOKEN_REQUIRED")
        }

        const user = await userDao.findById(user_id)

        if (!user) {
            throw new AppError("User not found", 404, "USER_NOT_FOUND")
        }

        const tokenHash = crypto.createHash('sha256').update(normalizedToken).digest('hex')
        const invite = await organizationInviteDao.findByTokenHash(tokenHash)

        if (!invite) {
            throw new AppError ("Invitation not found", 404, "INVITATION_NOT_FOUND")
        }

        if (invite.tenant_id !== tenant_id) {
            throw new AppError("Invitation does not belong to this tenant", 403, "INVALID_TENANT_INVITATION")
        }

        if (invite.status !== 'pending'){
            throw new AppError("Invitation is no longer valid", 409, "INVITATION_NOT_ACTIVE")
        }

        if (new Date(invite.expires_at) < new Date()){
            throw new AppError("Invitation has expired", 410, "INVITATION_EXPIRED")
        }

        if (user.user_email.toLowerCase() !== invite.invited_email.toLowerCase()){
            throw new AppError('This invitation is for a different email address', 403, 'INVITATION_EMAIL_MISMATCH');
        }

        const existingMembership = await organizationUserDao.findByOrganizationAndUser({
            organization_id: invite.organization_id,
            user_id,
            tenant_id,
        })

        if (existingMembership) {
            throw new AppError("User is already an organization member", 409, "ALREADY_ORGANIZATION_MEMBER")
        }

        await organizationUserDao.create({
            tenant_id,
            organization_id: invite.organization_id,
            user_id,
            role: invite.role,
        })

        await organizationInviteDao.markAccepted({
            invite_id: invite.invite_id,
            accepted_by: user_id,
            tenant_id,
        })

        return {
            success: true,
            message:"Invitation accepted successfully",
            data: {
                organization_id: invite.organization_id,
                userId: user_id,
                role: invite.role
            }
        }
    }
}

module.exports = new organizationInviteService ();