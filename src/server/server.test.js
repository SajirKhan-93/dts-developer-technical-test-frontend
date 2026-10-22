import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  vi
} from 'vitest'
import * as cheerio from 'cheerio'

import { createServer } from './server.js'

const jsonResponse = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status })

const task = {
  id: 1,
  title: 'Review bundle',
  description: 'Check it',
  status: 'TODO',
  dueDateTime: '2099-11-30T17:00:00',
  createdAt: '2026-10-22T09:15:30.000Z'
}

const cookiesFrom = (res) =>
  []
    .concat(res.headers['set-cookie'] ?? [])
    .map((cookie) => cookie.split(';')[0])
    .join('; ')

describe('frontend server', () => {
  let server
  let fetchMock

  const get = (url, cookie) =>
    server.inject({ method: 'GET', url, headers: cookie ? { cookie } : {} })

  const post = (url, payload, cookie) =>
    server.inject({
      method: 'POST',
      url,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        ...(cookie ? { cookie } : {})
      },
      payload: new URLSearchParams(payload).toString()
    })

  // Loads a page and returns what a browser would send back on a form POST
  const loadForm = async (url) => {
    const res = await get(url)
    const crumb = cheerio.load(res.payload)('input[name="crumb"]').val()
    return { crumb, cookie: cookiesFrom(res) }
  }

  // A user's browser: keeps cookies between requests (the session and CSRF token)
  const createBrowser = () => {
    const jar = {}

    const send = async (method, url, payload) => {
      const cookie = Object.entries(jar)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')
      const res = await server.inject({
        method,
        url,
        headers: {
          ...(cookie && { cookie }),
          ...(payload !== undefined && {
            'content-type': 'application/x-www-form-urlencoded'
          })
        },
        payload
      })

      for (const setCookie of [].concat(res.headers['set-cookie'] ?? [])) {
        const [pair] = setCookie.split(';')
        const separator = pair.indexOf('=')
        jar[pair.slice(0, separator)] = pair.slice(separator + 1)
      }

      return res
    }

    return {
      get: (url) => send('GET', url),
      post: (url, fields) =>
        send('POST', url, new URLSearchParams(fields).toString()),
      // Like a user: open the page to get its CSRF token, then send the form
      submit: async (url, fields) => {
        const form = await send('GET', url)
        const crumb = cheerio.load(form.payload)('input[name="crumb"]').val()
        return send(
          'POST',
          url,
          new URLSearchParams({ crumb, ...fields }).toString()
        )
      }
    }
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  describe('GET /', () => {
    test('lists the tasks', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, [task]))

      const res = await get('/')
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('table a').text()).toBe('Review bundle')
      expect($('table').text()).toContain('30 November 2099, 17:00')
      expect($('.govuk-tag').text()).toContain('To do')
      expect($('table th').first().text()).toBe('Title')
      expect($('table th').eq(1).text()).toBe('Due')
      expect($('table th').text()).not.toContain('Created')
      expect($('.govuk-pagination').length).toBe(0)
      expect(res.headers['cache-control']).toBe('no-store')
    })

    test('shows an empty state', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, []))

      const res = await get('/')

      expect(res.payload).toContain('There are no tasks yet.')
    })

    test('flags overdue tasks', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(200, [{ ...task, dueDateTime: '2000-01-01T09:00:00' }])
      )

      const res = await get('/')

      expect(res.payload).toContain('Overdue')
    })

    test('shows an error when the backend is unavailable', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))

      const res = await get('/')

      expect(res.statusCode).toBe(503)
      expect(res.payload).toContain('The task service is unavailable')
    })

    test('asks the backend for all the tasks when there is no search', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, []))

      await get('/')

      expect(fetchMock.mock.calls[0][0]).toBe(
        'http://localhost:3001/api/v1/tasks'
      )
    })

    test('searches by title and keeps the search in the box', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, [task]))

      const res = await get('/?search=bundle')
      const $ = cheerio.load(res.payload)

      expect(fetchMock.mock.calls[0][0]).toBe(
        'http://localhost:3001/api/v1/tasks?search=bundle'
      )
      expect($('#search').val()).toBe('bundle')
      expect($('[data-testid="clear-search"]').attr('href')).toBe('/')
      expect($('[data-testid="results-summary"]').text()).toMatch(
        /1\s+tasks with a title containing\s+bundle/
      )
    })

    test('the search box is the same size as the title box', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, []))

      const res = await get('/')

      expect(
        cheerio.load(res.payload)('#search').hasClass('govuk-!-width-one-half')
      ).toBe(true)
    })

    test('says when nothing matches the search', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, []))

      const res = await get('/?search=nothing')

      expect(
        cheerio.load(res.payload)('[data-testid="no-results"]').text()
      ).toContain('nothing')
    })

    test('reports a search that is too long and lists the unfiltered tasks', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, [task]))

      const res = await get(`/?search=${'a'.repeat(300)}`)

      expect(res.payload).toContain('Search must be 255 characters or fewer')
      expect(fetchMock.mock.calls[0][0]).not.toContain('search=')
    })
  })

  describe('create a task', () => {
    const goodAnswers = {
      title: { title: ' Review   bundle ' },
      description: { description: ' Check it ' },
      status: { status: 'TODO' },
      dueDate: {
        'dueDate-day': '30',
        'dueDate-month': '11',
        'dueDate-year': '2099',
        dueTime: '17:00'
      }
    }

    // Answers each question in turn, as a user would
    const answerAllQuestions = async (browser) => {
      await browser.get('/tasks/new')
      fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))
      await browser.submit('/tasks/new/title', goodAnswers.title)
      await browser.submit('/tasks/new/description', goodAnswers.description)
      await browser.submit('/tasks/new/status', goodAnswers.status)
      await browser.submit('/tasks/new/due-date', goodAnswers.dueDate)
    }

    test('GET /tasks/new starts the journey at the title page', async () => {
      const res = await createBrowser().get('/tasks/new')

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/tasks/new/title')
    })

    test.each([
      ['/tasks/new/title', '#title', 'What is the title of the task?'],
      ['/tasks/new/description', '#description', 'Add a description'],
      [
        '/tasks/new/status',
        'input[name="status"]',
        'What is the status of the task?'
      ],
      ['/tasks/new/due-date', '#dueTime', 'When is the task due?']
    ])(
      '%s is its own page with a CSRF token',
      async (url, selector, heading) => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))
        await browser.submit('/tasks/new/title', goodAnswers.title)
        await browser.submit('/tasks/new/description', goodAnswers.description)
        await browser.submit('/tasks/new/status', goodAnswers.status)

        const res = await browser.get(url)
        const $ = cheerio.load(res.payload)

        expect(res.statusCode).toBe(200)
        expect($('h1').text().trim()).toContain(heading)
        expect($(selector).length).toBeGreaterThan(0)
        expect($('input[name="crumb"]').val()).toBeTruthy()
      }
    )

    test('each question page asks for one thing', async () => {
      const browser = createBrowser()
      await browser.get('/tasks/new')

      const title = cheerio.load(
        (await browser.get('/tasks/new/title')).payload
      )

      expect(title('main input[type="text"]').length).toBe(1)
      expect(title('#title').hasClass('govuk-!-width-one-half')).toBe(true)
      expect(title('main textarea').length).toBe(0)
    })

    test('rejects a POST without a CSRF token', async () => {
      const res = await createBrowser().post('/tasks/new/title', { title: 'T' })

      expect(res.statusCode).toBe(403)
    })

    test('the later pages send the user back to the first unanswered question', async () => {
      const browser = createBrowser()

      expect(
        (await browser.get('/tasks/new/description')).headers.location
      ).toBe('/tasks/new/title')
      expect(
        (await browser.get('/tasks/new/check-answers')).headers.location
      ).toBe('/tasks/new/title')
    })

    describe('title page', () => {
      test('asks the backend whether the title is taken, then moves on', async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))

        const res = await browser.submit('/tasks/new/title', goodAnswers.title)

        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toBe('/tasks/new/description')
        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('http://localhost:3001/api/v1/tasks/check-title')
        expect(JSON.parse(options.body)).toEqual({ title: 'Review bundle' })
      })

      test('shows an error when the title is already used', async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockResolvedValueOnce(
          jsonResponse(400, {
            validationErrors: [
              { field: 'title', errorCode: 'TASK_TITLE_DUPLICATE' }
            ]
          })
        )

        const res = await browser.submit('/tasks/new/title', { title: 'Taken' })
        const $ = cheerio.load(res.payload)

        expect(res.statusCode).toBe(200)
        expect($('.govuk-error-summary').text()).toContain(
          'A task with this title already exists'
        )
        expect($('#title').val()).toBe('Taken')
        expect($('.govuk-error-summary a').attr('href')).toBe('#title')
      })

      test('shows an error and skips the backend check when the title is empty', async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')

        const res = await browser.submit('/tasks/new/title', { title: '  ' })

        expect(res.payload).toContain('Enter a title')
        expect(fetchMock).not.toHaveBeenCalled()
      })

      test('shows an error when the backend cannot be reached', async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))

        const res = await browser.submit('/tasks/new/title', goodAnswers.title)

        expect(res.payload).toContain('The task service is unavailable')
      })
    })

    describe('description page', () => {
      test('is optional', async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))
        await browser.submit('/tasks/new/title', goodAnswers.title)

        const res = await browser.submit('/tasks/new/description', {
          description: ''
        })

        expect(res.headers.location).toBe('/tasks/new/status')
      })

      test('rejects a description that is too long', async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))
        await browser.submit('/tasks/new/title', goodAnswers.title)

        const res = await browser.submit('/tasks/new/description', {
          description: 'a'.repeat(2001)
        })

        expect(res.payload).toContain(
          'Description must be 2000 characters or fewer'
        )
      })
    })

    describe('status page', () => {
      test('needs a status to be chosen', async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))
        await browser.submit('/tasks/new/title', goodAnswers.title)

        const res = await browser.submit('/tasks/new/status', {})

        expect(res.payload).toContain('Select a status')
        expect(
          cheerio.load(res.payload)('.govuk-error-summary a').attr('href')
        ).toBe('#status')
      })

      test('rejects an unknown status', async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))
        await browser.submit('/tasks/new/title', goodAnswers.title)

        const res = await browser.submit('/tasks/new/status', {
          status: 'DONE'
        })

        expect(res.payload).toContain('Select a valid status')
      })
    })

    describe('due date page', () => {
      const reachDueDate = async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))
        await browser.submit('/tasks/new/title', goodAnswers.title)
        await browser.submit('/tasks/new/status', goodAnswers.status)
        return browser
      }

      test('shows an error for a date that does not exist', async () => {
        const browser = await reachDueDate()

        const res = await browser.submit('/tasks/new/due-date', {
          ...goodAnswers.dueDate,
          'dueDate-day': '31',
          'dueDate-month': '2'
        })

        expect(res.payload).toContain('Due date must be a real date')
        expect(cheerio.load(res.payload)('#dueDate-day').val()).toBe('31')
      })

      test('shows an error for an invalid time, linked to the time input', async () => {
        const browser = await reachDueDate()

        const res = await browser.submit('/tasks/new/due-date', {
          ...goodAnswers.dueDate,
          dueTime: '25:00'
        })
        const $ = cheerio.load(res.payload)

        expect(res.payload).toContain('Due time must be in 24-hour format')
        expect($('.govuk-error-summary a').attr('href')).toBe('#dueTime')
      })

      test('shows an error for both the date and the time when both are empty', async () => {
        const browser = await reachDueDate()

        const res = await browser.submit('/tasks/new/due-date', {
          'dueDate-day': '',
          'dueDate-month': '',
          'dueDate-year': '',
          dueTime: ''
        })
        const $ = cheerio.load(res.payload)

        expect(
          $('.govuk-error-summary a')
            .map((_, link) => $(link).text())
            .get()
        ).toEqual(['Enter a due date', 'Enter a due time'])
        expect($('#dueDate-error').text()).toContain('Enter a due date')
        expect($('#dueTime-error').text()).toContain('Enter a due time')
      })

      test('moves on to check answers', async () => {
        const browser = await reachDueDate()

        const res = await browser.submit(
          '/tasks/new/due-date',
          goodAnswers.dueDate
        )

        expect(res.headers.location).toBe('/tasks/new/check-answers')
      })
    })

    describe('check answers page', () => {
      test('summarises the answers with a Change link for each', async () => {
        const browser = createBrowser()
        await answerAllQuestions(browser)

        const res = await browser.get('/tasks/new/check-answers')
        const $ = cheerio.load(res.payload)
        const summary = $('.govuk-summary-list').text()

        expect(res.statusCode).toBe(200)
        expect(summary).toContain('Review bundle')
        expect(summary).toContain('Check it')
        expect(summary).toContain('To do')
        expect(summary).toContain('30 November 2099, 17:00')
        expect(
          $('.govuk-summary-list__actions a')
            .map((_, link) => $(link).attr('href'))
            .get()
        ).toEqual([
          '/tasks/new/title?from=check-answers',
          '/tasks/new/description?from=check-answers',
          '/tasks/new/status?from=check-answers',
          '/tasks/new/due-date?from=check-answers'
        ])
      })

      test('shows N/A when the description was left blank', async () => {
        const browser = createBrowser()
        await browser.get('/tasks/new')
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))
        await browser.submit('/tasks/new/title', goodAnswers.title)
        await browser.submit('/tasks/new/description', { description: '' })
        await browser.submit('/tasks/new/status', goodAnswers.status)
        await browser.submit('/tasks/new/due-date', goodAnswers.dueDate)

        const res = await browser.get('/tasks/new/check-answers')

        expect(
          cheerio.load(res.payload)('.govuk-summary-list__value').eq(1).text()
        ).toContain('N/A')
      })

      test('creates the task, redirects to it and shows a notice once', async () => {
        const browser = createBrowser()
        await answerAllQuestions(browser)
        fetchMock.mockResolvedValueOnce(jsonResponse(201, task))

        const res = await browser.submit('/tasks/new/check-answers', {})

        expect(res.statusCode).toBe(302)
        expect(res.headers.location).toBe('/tasks/1')
        const createCall = fetchMock.mock.calls.at(-1)
        expect(createCall[1].method).toBe('POST')
        expect(JSON.parse(createCall[1].body)).toEqual({
          title: 'Review bundle',
          description: 'Check it',
          status: 'TODO',
          dueDateTime: '2099-11-30T17:00:00'
        })

        fetchMock.mockResolvedValue(jsonResponse(200, task))
        const first = await browser.get('/tasks/1')
        const second = await browser.get('/tasks/1')

        expect(first.payload).toContain('Task created')
        expect(second.payload).not.toContain('Task created')
      })

      test('forgets the answers once the task is created', async () => {
        const browser = createBrowser()
        await answerAllQuestions(browser)
        fetchMock.mockResolvedValueOnce(jsonResponse(201, task))
        await browser.submit('/tasks/new/check-answers', {})

        const res = await browser.get('/tasks/new/check-answers')

        expect(res.headers.location).toBe('/tasks/new/title')
      })

      test('links back to the title page when the title was taken in the meantime', async () => {
        const browser = createBrowser()
        await answerAllQuestions(browser)
        fetchMock.mockResolvedValueOnce(
          jsonResponse(409, {
            errors: [
              {
                errorCode: 'TASK_TITLE_DUPLICATE',
                message: 'A task with this title already exists',
                field: 'title'
              }
            ]
          })
        )

        const res = await browser.submit('/tasks/new/check-answers', {})
        const $ = cheerio.load(res.payload)

        expect(res.statusCode).toBe(200)
        expect($('.govuk-error-summary').text()).toContain(
          'A task with this title already exists'
        )
        expect($('.govuk-error-summary a').attr('href')).toBe(
          '/tasks/new/title?from=check-answers'
        )
      })

      test('shows an error when the backend cannot be reached', async () => {
        const browser = createBrowser()
        await answerAllQuestions(browser)
        fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))

        const res = await browser.submit('/tasks/new/check-answers', {})

        expect(res.payload).toContain('The task service is unavailable')
      })
    })

    describe('changing an answer', () => {
      test('pre-fills the page and returns to check answers after saving', async () => {
        const browser = createBrowser()
        await answerAllQuestions(browser)

        const page = await browser.get(
          '/tasks/new/description?from=check-answers'
        )
        const $ = cheerio.load(page.payload)

        expect($('#description').text()).toBe('Check it')
        expect($('.govuk-back-link').attr('href')).toBe(
          '/tasks/new/check-answers'
        )

        const res = await browser.submit(
          '/tasks/new/description?from=check-answers',
          { description: 'Changed' }
        )

        expect(res.headers.location).toBe('/tasks/new/check-answers')
        const summary = cheerio
          .load((await browser.get('/tasks/new/check-answers')).payload)(
            '.govuk-summary-list'
          )
          .text()
        expect(summary).toContain('Changed')
      })

      test('a new title is checked for duplicates before returning', async () => {
        const browser = createBrowser()
        await answerAllQuestions(browser)
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { valid: true }))

        const res = await browser.submit(
          '/tasks/new/title?from=check-answers',
          {
            title: 'Another'
          }
        )

        expect(fetchMock.mock.calls.at(-1)[0]).toContain('/check-title')
        expect(res.headers.location).toBe('/tasks/new/check-answers')
      })
    })
  })

  describe('view a task', () => {
    test('GET /tasks/{id} shows the task and a status form', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, task))

      const res = await get('/tasks/1')
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toBe('Review bundle')
      expect($('select[name="status"] option[selected]').val()).toBe('TODO')
      expect($('.govuk-summary-list').text()).toContain('Check it')
      expect(fetchMock.mock.calls[0][0]).toBe(
        'http://localhost:3001/api/v1/tasks/1'
      )
    })

    test('shows N/A when the task has no description', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(200, { ...task, description: null })
      )

      const res = await get('/tasks/1')

      expect(cheerio.load(res.payload)('.govuk-summary-list').text()).toContain(
        'N/A'
      )
    })

    test('escapes user input', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(200, { ...task, title: '<script>alert(1)</script>' })
      )

      const res = await get('/tasks/1')

      expect(res.payload).not.toContain('<script>alert(1)</script>')
      expect(res.payload).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    })

    test('returns 404 when the task does not exist', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(404, { errors: [{ errorCode: 'TASK_NOT_FOUND' }] })
      )

      const res = await get('/tasks/99')

      expect(res.statusCode).toBe(404)
      expect(res.payload).toContain('Page not found')
    })

    test('returns 404 for a non-numeric id without calling the backend', async () => {
      const res = await get('/tasks/abc')

      expect(res.statusCode).toBe(404)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('update the status', () => {
    test('updates the status and redirects back to the task', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, task))
      const { crumb, cookie } = await loadForm('/tasks/1')
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, { ...task, status: 'COMPLETED' })
      )

      const res = await post(
        '/tasks/1/status',
        { crumb, status: 'COMPLETED' },
        cookie
      )

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/tasks/1')
      expect(fetchMock.mock.calls[1][0]).toBe(
        'http://localhost:3001/api/v1/tasks/1/status'
      )
      expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
        status: 'COMPLETED'
      })
    })

    test('rejects an unknown status without updating', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, task))
      const { crumb, cookie } = await loadForm('/tasks/1')
      fetchMock.mockResolvedValueOnce(jsonResponse(200, task))

      const res = await post(
        '/tasks/1/status',
        { crumb, status: 'DONE' },
        cookie
      )

      expect(res.statusCode).toBe(200)
      expect(res.payload).toContain('Select a valid status')
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(
        fetchMock.mock.calls.some(([, options]) => options.method === 'PATCH')
      ).toBe(false)
    })
  })

  describe('delete a task', () => {
    test('asks for confirmation before deleting', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, task))

      const res = await get('/tasks/1/delete')

      expect(res.statusCode).toBe(200)
      expect(res.payload).toContain('Delete this task?')
    })

    test('deletes the task and redirects to the list', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, task))
      const { crumb, cookie } = await loadForm('/tasks/1/delete')
      fetchMock.mockResolvedValueOnce(jsonResponse(204))

      const res = await post('/tasks/1/delete', { crumb }, cookie)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toBe('/')
      expect(fetchMock.mock.calls[1][1].method).toBe('DELETE')
    })

    test('shows not found when the task is already gone', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(200, task))
      const { crumb, cookie } = await loadForm('/tasks/1/delete')
      fetchMock.mockResolvedValueOnce(
        jsonResponse(404, { errors: [{ errorCode: 'TASK_NOT_FOUND' }] })
      )

      const res = await post('/tasks/1/delete', { crumb }, cookie)

      expect(res.statusCode).toBe(404)
    })
  })

  describe('platform routes', () => {
    test('GET /health', async () => {
      const res = await get('/health')

      expect(res.statusCode).toBe(200)
      expect(res.result).toEqual({ message: 'success' })
    })

    test('serves the GOV.UK Frontend stylesheet and fonts', async () => {
      const css = await get('/public/govuk-frontend.min.css')
      const js = await get('/public/govuk-frontend.min.js')

      expect(css.statusCode).toBe(200)
      expect(js.statusCode).toBe(200)
      expect(css.headers['content-type']).toContain('text/css')
    })

    test('unknown routes render the not found page', async () => {
      const res = await get('/nope')

      expect(res.statusCode).toBe(404)
      expect(res.payload).toContain('Page not found')
    })
  })
})
