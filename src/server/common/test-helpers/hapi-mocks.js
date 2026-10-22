import { vi } from 'vitest'

/** A stand-in for Hapi's response toolkit; every call returns the toolkit so calls can be chained */
export function buildH() {
  const h = {
    view: vi.fn(),
    redirect: vi.fn(),
    response: vi.fn(),
    code: vi.fn(),
    takeover: vi.fn(),
    file: vi.fn(),
    continue: Symbol('continue')
  }

  for (const method of ['view', 'redirect', 'response', 'code', 'file']) {
    h[method].mockReturnValue(h)
  }
  h.takeover.mockReturnValue(Symbol('takeover'))

  return h
}

/**
 * A stand-in for a Hapi request with an in-memory session (yar), including
 * one-time flash messages. Pass `session` to start with answers already stored.
 */
export function buildRequest({ session = {}, ...overrides } = {}) {
  const store = { ...session }
  const flashes = {}

  return {
    params: {},
    query: {},
    payload: {},
    path: '/',
    logger: { error: vi.fn(), info: vi.fn() },
    server: { logger: { info: vi.fn(), error: vi.fn() } },
    yar: {
      get: vi.fn((key) => store[key]),
      set: vi.fn((key, value) => {
        store[key] = value
      }),
      clear: vi.fn((key) => {
        delete store[key]
      }),
      flash: vi.fn((key, value) => {
        if (value === undefined) {
          const messages = flashes[key] ?? []
          delete flashes[key]
          return messages
        }
        flashes[key] = [...(flashes[key] ?? []), value]
        return undefined
      })
    },
    ...overrides
  }
}

export const apiOk = (data) => ({ success: true, status: 200, data })

export const apiFail = (status, extra = {}) => ({
  success: false,
  status,
  ...extra
})
