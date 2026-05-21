const organizationInviteService = require('../service/application/organizationInviteService')
const userDao = require('../dao/userDao')
const AppError = require('../utils/AppError')

class organizationInviteController {
    async listInvites(req, res, next) {
        try {
            const organization_id = req.params?.organization_id
            const tenant_id = req.user?.tenantId
            const firebaseUid = req.user?.uid

            const invites = await organizationInviteService.listInvites({
                organization_id,
                tenant_id,
                firebaseUid,
            })

            return res.status(200).json(invites)
        } catch (error) {
            next(error)
        }
    }
    async listOrganizations(req, res, next) {
        try {
            const tenant_id = req.user?.tenantId
            const firebaseUid = req.user?.uid

            const organizations = await organizationInviteService.listOrganizations({
                tenant_id,
                firebaseUid,
            })

            return res.status(200).json(organizations)
        } catch (error) {
            next(error)
        }
    }

    async listMembers(req, res, next) {
        try {
            const organization_id = req.params?.organization_id
            const tenant_id = req.user?.tenantId
            const firebaseUid = req.user?.uid

            const members = await organizationInviteService.listMembers({
                organization_id,
                tenant_id,
                firebaseUid,
            })

            return res.status(200).json(members)
        } catch (error) {
            next(error)
        }
    }

    async createInvite(req, res, next) {
        try {
            const organization_id = req.params?.organization_id ?? req.body?.organization_id
            const invitedEmail = req.body?.invitedEmail ?? req.body?.invited_email
            const role = req.body?.role
            const firebaseUid = req.user?.uid
            const tenant_id = req.user?.tenantId

            let invitedByUserId = null
            if (!firebaseUid) {
                throw new AppError('Authentication required to create an invitation', 401, 'UNAUTHORIZED')
            }

            const dbUser = await userDao.findByFirebaseUid(firebaseUid)
            if (!dbUser) {
                throw new AppError('Authenticated user not found in database', 404, 'USER_NOT_FOUND')
            }

            invitedByUserId = dbUser.user_id

            const invite = await organizationInviteService.createInvite({
                organization_id,
                invitedEmail,
                role,
                invitedByUserId,
                tenant_id,
            })

            return res.status(201).json(invite)
        } catch (error) {
            next(error)
        }
    }

    async resendInvite(req, res, next) {
        try {
            const organization_id = req.params?.organization_id
            const invite_id = req.params?.invite_id
            const tenant_id = req.user?.tenantId
            const firebaseUid = req.user?.uid

            const invite = await organizationInviteService.resendInvite({
                organization_id,
                invite_id,
                tenant_id,
                firebaseUid,
            })

            return res.status(200).json(invite)
        } catch (error) {
            next(error)
        }
    }

    async cancelInvite(req, res, next) {
        try {
            const organization_id = req.params?.organization_id
            const invite_id = req.params?.invite_id
            const tenant_id = req.user?.tenantId
            const firebaseUid = req.user?.uid

            const invite = await organizationInviteService.cancelInvite({
                organization_id,
                invite_id,
                tenant_id,
                firebaseUid,
            })

            return res.status(200).json(invite)
        } catch (error) {
            next(error)
        }
    }

    async removeMember(req, res, next) {
        try {
            const organization_id = req.params?.organization_id
            const user_id = req.params?.user_id
            const tenant_id = req.user?.tenantId
            const firebaseUid = req.user?.uid

            const removed = await organizationInviteService.removeMember({
                organization_id,
                user_id,
                tenant_id,
                firebaseUid,
            })

            return res.status(200).json(removed)
        } catch (error) {
            next(error)
        }
    }

    async getInviteByToken(req, res, next) {
        try {
            const token = req.params?.token ?? req.body?.token

            const invite = await organizationInviteService.getInviteByToken(token)

            return res.status(200).json(invite)
        } catch (error) {
            next(error)
        }
    }

    async acceptInvite(req, res, next) {
        try {
            const token = req.params?.token ?? req.body?.token
            const firebaseUid = req.user?.uid
            const tenant_id = req.user?.tenantId

            if (!firebaseUid) {
                throw new AppError('Authentication required to accept an invitation', 401, 'UNAUTHORIZED')
            }

            const dbUser = await userDao.findByFirebaseUid(firebaseUid)
            if (!dbUser) {
                // If the authenticated Firebase user has no DB row yet, instruct frontend
                // to redirect the user to signup so they create their DB record first.
                const inviteResp = await organizationInviteService.getInviteByToken(token)
                const invite = inviteResp && inviteResp.data ? inviteResp.data : null

                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
                const invitedEmail = invite?.invited_email || null
                const signupRedirect = `${frontendUrl}/signup?token=${encodeURIComponent(token)}${invitedEmail ? `&email=${encodeURIComponent(invitedEmail)}` : ''}`

                return res.status(409).json({
                    success: false,
                    code: 'INVITE_REQUIRES_SIGNUP',
                    message: 'Authenticated user not found in database; please sign up before accepting the invite',
                    data: {
                        invitedEmail,
                        signupRedirect,
                        token,
                    }
                })
            }

            const user_id = dbUser.user_id

            const accepted = await organizationInviteService.acceptInvite({
                token,
                user_id,
                tenant_id,
            })

            return res.status(200).json(accepted)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new organizationInviteController()
