import { describe, test, expect } from 'vitest'

import * as globals from './globals.js'
import { TASK_STATUS_TAG_CLASS } from '../../../server/common/constants/tasks.js'

describe('nunjucks globals', () => {
  test('exposes the status tag classes to templates', () => {
    expect(Object.keys(globals)).toEqual(['TASK_STATUS_TAG_CLASS'])
    expect(globals.TASK_STATUS_TAG_CLASS).toBe(TASK_STATUS_TAG_CLASS)
    expect(globals.TASK_STATUS_TAG_CLASS).toEqual({
      TODO: 'govuk-tag--grey',
      IN_PROGRESS: 'govuk-tag--blue',
      COMPLETED: 'govuk-tag--green'
    })
  })
})
