import { describe, test, expect } from 'vitest'
import { validateDescription, validateStatus, validateTitle } from './schema.js'

describe('tasks form schema', () => {
  describe('validateTitle', () => {
    test('accepts a title, trims it and collapses repeated spaces', () => {
      const { value, errors } = validateTitle({
        title: '  Review   the  bundle '
      })

      expect(errors).toEqual({})
      expect(value).toEqual({ title: 'Review the bundle' })
    })

    test('requires a title', () => {
      expect(validateTitle({ title: '   ' }).errors).toEqual({
        title: 'TASK_TITLE_REQUIRED'
      })
      expect(validateTitle({}).errors).toEqual({
        title: 'TASK_TITLE_REQUIRED'
      })
    })

    test('rejects a title that is too long', () => {
      expect(validateTitle({ title: 'a'.repeat(256) }).errors).toEqual({
        title: 'TASK_TITLE_TOO_LONG'
      })
    })
  })

  describe('validateDescription', () => {
    test('accepts a description and trims it', () => {
      expect(validateDescription({ description: ' detail ' }).value).toEqual({
        description: 'detail'
      })
    })

    test('allows an empty or missing description', () => {
      expect(validateDescription({ description: '' }).errors).toEqual({})
      expect(validateDescription({}).errors).toEqual({})
    })

    test('rejects a description that is too long', () => {
      expect(
        validateDescription({ description: 'a'.repeat(2001) }).errors
      ).toEqual({ description: 'TASK_DESCRIPTION_TOO_LONG' })
    })
  })

  describe('validateStatus', () => {
    test('accepts a valid status', () => {
      expect(validateStatus({ status: 'COMPLETED' }).errors).toEqual({})
    })

    test('rejects an unknown status', () => {
      expect(validateStatus({ status: 'x' }).errors).toEqual({
        status: 'TASK_STATUS_INVALID'
      })
    })

    test('asks for a status when none is chosen', () => {
      expect(validateStatus({}).errors).toEqual({
        status: 'TASK_STATUS_REQUIRED'
      })
    })
  })
})
