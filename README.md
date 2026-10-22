# HMCTS Task Manager - Frontend (HapiJS + Nunjucks)

A server-side rendered GOV.UK Design System frontend for caseworker tasks, written in the same style as `pafs-portal-frontend`: Hapi plugins per page (`modules/<feature>/<page>/{index.js,controller.js,index.njk}`), Nunjucks layouts, Joi form validation, `@hapi/crumb` CSRF protection, `@hapi/yar` session flash messages, convict config, pino logging, Vitest tests.

Runs on **http://localhost:3000** and calls the backend at `http://localhost:3001`.

## Set up from scratch

The frontend has no database; it only needs Node.js and a running backend.

1. **Install Node.js 24 or newer** from https://nodejs.org (check with `node -v`).
2. **Set up and start the backend** (`hmcts-dev-test-backend-own`) first. Its README explains how to install PostgreSQL, create the database and start it. It must be running on http://localhost:3001.
3. **Install the dependencies** (in this folder): `npm install`
4. **Start the frontend** as described below, then open http://localhost:3000.

| Problem                                   | Likely cause                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| "The task service is unavailable" message | The backend is not running, or `BACKEND_API_URL` points to the wrong place |
| `EADDRINUSE`                              | Something is already using port 3000 (stop the old process)                |
| `Cannot find module ...`                  | `npm install` has not been run in this folder                              |

Tests need none of this: `npm test` mocks the backend.

## Run it

Requires Node 24+ (`.nvmrc`). Start `hmcts-dev-test-backend-own` first.

### From VS Code (recommended)

Open this folder in VS Code (or the parent `Code Challenge` folder, which has the same launch settings), run `npm install` once, then open **Run and Debug** and start **Frontend: run (port 3000)** (F5). Its settings are in `.vscode/launch.json`. Breakpoints work, and **Frontend: run tests** is there too. To start the backend and frontend together, open the parent `Code Challenge` folder (or `hmcts-own.code-workspace`) and run **Backend + Frontend** (replace `DB_PASSWORD` in the backend settings first).

If VS Code uses an old Node version, restart it so it picks up Node 24.

### From a terminal

```powershell
npm install
npm run dev
```

Open http://localhost:3000.

| Variable                  | Default                 | Notes                                                      |
| ------------------------- | ----------------------- | ---------------------------------------------------------- |
| `PORT`                    | `3000`                  |                                                            |
| `BACKEND_API_URL`         | `http://localhost:3001` |                                                            |
| `BACKEND_API_TIMEOUT_MS`  | `5000`                  |                                                            |
| `SESSION_COOKIE_PASSWORD` | insecure dev default    | Must be set (32+ characters) when `NODE_ENV=production`    |
| `SECURE_COOKIES`          | `true` in production    | Set `false` to run production mode over plain http locally |

Production mode: `npm start`.

## Pages

| Route                               | Page                                                                  |
| ----------------------------------- | --------------------------------------------------------------------- |
| `GET /`                             | Task list, newest first, with a search by title (`?search=`)          |
| `GET /tasks/new`                    | Starts a new task (clears earlier answers) and goes to the title page |
| `GET/POST /tasks/new/title`         | Title. Checked with the backend so it is not already used             |
| `GET/POST /tasks/new/description`   | Description (optional)                                                |
| `GET/POST /tasks/new/status`        | Status (radio buttons)                                                |
| `GET/POST /tasks/new/due-date`      | Due date and time                                                     |
| `GET/POST /tasks/new/check-answers` | Summary with Change links, then creates the task                      |
| `GET /tasks/{id}`                   | View a task and update its status                                     |
| `POST /tasks/{id}/status`           | Update the status                                                     |
| `GET/POST /tasks/{id}/delete`       | Delete confirmation, then delete                                      |
| `GET /health`                       | Health check                                                          |

Creating a task is a journey with one question per page, as in PAFS. Answers are kept in the session (`@hapi/yar`, stored on the server) until the task is created. A page reached before its earlier questions are answered redirects to the first unanswered one. The Change links on the check answers page add `?from=check-answers`, so saving an answer returns there instead of continuing the journey.

The list searches titles (case-insensitive, "contains") and shows every matching task, newest created first. The search box is the same width as the title box.

## How it fits together

- `src/server/modules/tasks/*` - one Hapi plugin per page. Routes are listed in `src/server/router.js`.
- `src/server/common/services/task/task-service.js` - calls the backend with `fetch` and always returns `{ success, status, data | errors | validationErrors }`, so controllers never handle thrown network errors.
- Forms are validated here first (`modules/tasks/schema.js`, `common/helpers/due-date.js`); errors from the backend (`validationErrors`) are mapped back onto the same fields. Both use error codes that are turned into text in `src/server/common/locales/en.js`.
- GOV.UK Frontend CSS, JS, fonts and images are served straight from `node_modules` (`/public`, `/assets`), so there is no asset build step (PAFS builds them with Vite).
- Not included from PAFS: authentication, Redis session cache, content security policy, i18n library, metrics.

## Tests

```powershell
npm test          # Vitest with coverage; the backend is mocked
npm run lint
npm run format:check
```

`src/server/server.test.js` drives the whole app through `server.inject` (CSRF tokens, redirects, flash message, errors).

Tests sit next to the file they test, as in PAFS: a `controller.test.js` and `index.test.js` for every page module, plus tests for the journey helpers, schemas, task service, error handling, config, filters and the router. Controller tests mock the backend service and Hapi's `h` toolkit (`src/server/common/test-helpers/hapi-mocks.js`).
