export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
}

export const TASK_STATUSES = Object.values(TASK_STATUS)

export const TASK_STATUS_TAG_CLASS = {
  TODO: 'govuk-tag--grey',
  IN_PROGRESS: 'govuk-tag--blue',
  COMPLETED: 'govuk-tag--green'
}

export const TASK_VIEWS = {
  LIST: 'modules/tasks/list/index',
  CREATE_TITLE: 'modules/tasks/create/title/index',
  CREATE_DESCRIPTION: 'modules/tasks/create/description/index',
  CREATE_STATUS: 'modules/tasks/create/status/index',
  CREATE_DUE_DATE: 'modules/tasks/create/due-date/index',
  CREATE_CHECK_ANSWERS: 'modules/tasks/create/check-answers/index',
  VIEW: 'modules/tasks/view/index',
  DELETE: 'modules/tasks/delete/index'
}

export const TASK_PAYLOAD_FIELDS = {
  TITLE: 'title',
  DESCRIPTION: 'description',
  STATUS: 'status',
  DUE_DATE: 'dueDate',
  DUE_TIME: 'dueTime'
}

export const SIZE = {
  LENGTH_255: 255,
  LENGTH_2000: 2000
}

export const NOTICE_KEY = 'notice'

// Where the answers of the create-a-task journey are kept between pages
export const JOURNEY_SESSION_KEY = 'newTask'

// Added to a page's URL by the Change links on the check answers page
export const CHANGE_FROM_CHECK_ANSWERS = 'check-answers'
