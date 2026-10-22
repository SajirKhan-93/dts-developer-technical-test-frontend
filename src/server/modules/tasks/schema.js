import Joi from 'joi'

import {
  SIZE,
  TASK_PAYLOAD_FIELDS,
  TASK_STATUSES
} from '../../common/constants/tasks.js'

/**
 * Params schema for routes with a task ID
 */
export const taskIdParamsSchema = Joi.object({
  id: Joi.string().pattern(/^\d{1,18}$/)
})

const titleSchema = Joi.string()
  .trim()
  .replace(/\s+/g, ' ')
  .max(SIZE.LENGTH_255)
  .required()
  .messages({
    'any.required': 'TASK_TITLE_REQUIRED',
    'string.base': 'TASK_TITLE_REQUIRED',
    'string.empty': 'TASK_TITLE_REQUIRED',
    'string.max': 'TASK_TITLE_TOO_LONG'
  })

const descriptionSchema = Joi.string()
  .trim()
  .max(SIZE.LENGTH_2000)
  .allow('')
  .optional()
  .messages({
    'string.base': 'TASK_DESCRIPTION_TOO_LONG',
    'string.max': 'TASK_DESCRIPTION_TOO_LONG'
  })

const statusSchema = Joi.string()
  .valid(...TASK_STATUSES)
  .required()
  .messages({
    'any.required': 'TASK_STATUS_REQUIRED',
    'any.only': 'TASK_STATUS_INVALID',
    'string.base': 'TASK_STATUS_INVALID',
    'string.empty': 'TASK_STATUS_REQUIRED'
  })

const titleFormSchema = Joi.object({
  [TASK_PAYLOAD_FIELDS.TITLE]: titleSchema
})

const descriptionFormSchema = Joi.object({
  [TASK_PAYLOAD_FIELDS.DESCRIPTION]: descriptionSchema
})

const updateStatusFormSchema = Joi.object({
  [TASK_PAYLOAD_FIELDS.STATUS]: statusSchema
})

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, { abortEarly: false })
  const errors = {}

  for (const detail of error?.details ?? []) {
    const field = detail.path[0]
    errors[field] ??= detail.message
  }

  return { value, errors }
}

/**
 * Validates the title entered on the title page.
 * @returns {{ value: Object, errors: Object<string, string> }} errors maps field -> error code
 */
export const validateTitle = (payload) =>
  validate(titleFormSchema, { title: payload.title ?? '' })

/**
 * Validates the optional description entered on the description page.
 */
export const validateDescription = (payload) =>
  validate(descriptionFormSchema, { description: payload.description ?? '' })

/**
 * Validates the status chosen on the status page or the task page.
 */
export const validateStatus = (payload) =>
  validate(updateStatusFormSchema, { status: payload.status || undefined })
