import { noop } from '../noop'

describe('noop', () => {
  it('should return true', () => {
    expect(noop()).toBe(true)
  })

  it('should return a boolean value', () => {
    expect(typeof noop()).toBe('boolean')
  })

  it('should be callable with no arguments', () => {
    expect(() => noop()).not.toThrow()
  })
})
