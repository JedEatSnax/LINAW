// Vitest globals (describe/it/expect) are provided by test runner
const userService = require('../../../service/application/userService')
const ValidationError = require('../../../service/application/userService').ValidationError || null

describe('userService validation', () => {
  it('throws ValidationError with field-level details for signup', () => {
    try {
      userService.validate('signupSchema', { body: {} })
      throw new Error('Expected validation to fail')
    } catch (err) {
      expect(err).toBeDefined()
      expect(err.name).toBe('ValidationError')
      expect(Array.isArray(err.details)).toBe(true)
      expect(err.details.length).toBeGreaterThan(0)
      const detail = err.details[0]
      expect(detail).toHaveProperty('field')
      expect(detail).toHaveProperty('message')
    }
  })
})
