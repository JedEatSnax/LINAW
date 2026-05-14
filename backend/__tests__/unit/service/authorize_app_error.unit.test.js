const authorization = require('../../../middleware/authorize')
const AppError = require('../../../utils/AppError')
const permission = require('../../../config/authorization/permission')

// Vitest globals (describe/it/expect/vi) are used; no explicit require needed

describe('authorization middleware (AppError mode)', () => {
  it('calls next with AppError UNAUTHORIZED when no user', () => {
    const mw = authorization.can(permission.MANAGE_NETWORK)
    const req = {}
    const res = {}
    const next = vi.fn()

    mw(req, res, next)

    expect(next).toHaveBeenCalled()
    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('calls next with AppError FORBIDDEN when user lacks permission', () => {
    const mw = authorization.can(permission.MANAGE_NETWORK)
    const req = { user: { role: 'member' } }
    const res = {}
    const next = vi.fn()

    mw(req, res, next)

    expect(next).toHaveBeenCalled()
    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
  })
})
