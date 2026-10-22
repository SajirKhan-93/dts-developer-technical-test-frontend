export const en = {
  common: {
    service_name: 'HMCTS Task Manager',
    back: 'Back',
    back_to_tasks: 'Back to tasks',
    there_is_a_problem: 'There is a problem',
    something_went_wrong: 'Something went wrong',
    try_again_later: 'Please try again later.',
    page_not_found: 'Page not found',
    forbidden: 'Forbidden',
    bad_request: 'Bad Request',
    overdue: 'Overdue'
  },
  tasks: {
    status: {
      TODO: 'To do',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed'
    },
    notices: {
      created: 'Task created',
      status_updated: 'Task status updated',
      deleted: 'Task deleted'
    },
    list: {
      page_title: 'Tasks',
      heading: 'Tasks',
      create_button: 'Create a task',
      caption: 'All tasks, newest first',
      title: 'Title',
      due: 'Due',
      status: 'Status',
      empty: 'There are no tasks yet.',
      no_matches: 'There are no tasks with a title containing',
      search: {
        aria_label: 'Search tasks',
        label: 'Search by title',
        hint: 'Enter part of a task title',
        button: 'Search',
        clear: 'Clear search'
      },
      summary: {
        matching: 'tasks with a title containing'
      }
    },
    create: {
      continue: 'Continue',
      title: {
        page_title: 'What is the title of the task?',
        heading: 'What is the title of the task?',
        hint: 'Each task must have a different title.'
      },
      description: {
        page_title: 'Add a description',
        heading: 'Add a description',
        hint: 'This is optional. Leave it blank if you do not need one.'
      },
      status: {
        page_title: 'What is the status of the task?',
        heading: 'What is the status of the task?'
      },
      due_date: {
        page_title: 'When is the task due?',
        heading: 'When is the task due?',
        date_label: 'Due date',
        date_hint: 'For example, 27 3 2027',
        time_label: 'Due time',
        time_hint: 'Use the 24-hour clock, for example 17:30'
      },
      check_answers: {
        page_title: 'Check your answers before creating the task',
        heading: 'Check your answers before creating the task',
        title: 'Title',
        description: 'Description',
        no_description: 'N/A',
        status: 'Status',
        due: 'Due',
        change: 'Change',
        submit: 'Create task'
      }
    },
    view: {
      page_title: 'Task',
      description: 'Description',
      no_description: 'N/A',
      due: 'Due',
      status: 'Status',
      update_status_label: 'Update status',
      update_status_button: 'Update status',
      delete_button: 'Delete task'
    },
    delete: {
      page_title: 'Delete task',
      heading: 'Delete this task?',
      warning: 'This cannot be undone.',
      warning_fallback: 'Warning',
      confirm_button: 'Delete task',
      cancel: 'Cancel'
    },
    errors: {
      TASK_TITLE_REQUIRED: 'Enter a title',
      TASK_TITLE_TOO_LONG: 'Title must be 255 characters or fewer',
      TASK_TITLE_DUPLICATE:
        'A task with this title already exists. Enter a different title',
      TASK_SEARCH_TOO_LONG: 'Search must be 255 characters or fewer',
      TASK_DESCRIPTION_TOO_LONG: 'Description must be 2000 characters or fewer',
      TASK_STATUS_INVALID: 'Select a valid status',
      TASK_STATUS_REQUIRED: 'Select a status',
      TASK_DUE_DATE_REQUIRED: 'Enter a due date',
      TASK_DUE_DATE_INVALID:
        'Due date must be a real date, for example 27 3 2027',
      TASK_DUE_TIME_REQUIRED: 'Enter a due time',
      TASK_DUE_TIME_INVALID:
        'Due time must be in 24-hour format, for example 17:30',
      TASK_DUE_DATE_TIME_REQUIRED: 'Enter a due date and time',
      TASK_DUE_DATE_TIME_INVALID: 'Enter a real due date and time',
      TASK_NOT_FOUND: 'Task not found',
      VALIDATION_INVALID_OBJECT: 'The submitted data is not valid',
      VALIDATION_UNKNOWN_FIELD: 'The submitted data is not valid',
      BACKEND_UNAVAILABLE:
        'The task service is unavailable. Please try again later.',
      UNEXPECTED: 'Something went wrong. Please try again.'
    }
  }
}
