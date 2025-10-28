import { describe, it, expect } from 'bun:test'

describe('App', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle environment setup', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })
})
