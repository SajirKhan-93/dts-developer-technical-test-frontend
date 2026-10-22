import { en } from './en.js'

/**
 * Looks up a message by dotted key (e.g. 'tasks.errors.TASK_TITLE_REQUIRED').
 * Falls back to the key so a missing message is visible rather than blank.
 */
export function translate(key) {
  const value = key.split('.').reduce((node, part) => node?.[part], en)
  return typeof value === 'string' ? value : key
}
