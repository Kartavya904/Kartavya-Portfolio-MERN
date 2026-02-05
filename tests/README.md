# Portfolio test suite

Run all features and API checks from the repo root or from each subfolder.

## Prerequisites

- **Backend tests:** Backend server must be running (e.g. `cd backend && npm run dev`) and listening on `http://localhost:5000` (or set `API_BASE_URL`).
- **Frontend tests:** No server required. Frontend tests live in `frontend/src` and run with CRA’s Jest (e.g. `frontend/src/services/variants.test.js`, `ping.test.js`).

## Run all tests (from repo root)

```bash
npm run test
```

This runs `test:backend` then `test:frontend`. Run them separately:

```bash
npm run test:backend   # needs backend running on port 5000
npm run test:frontend  # runs CRA Jest in frontend/
```

## Run from subfolders

```bash
cd tests/backend && npm test
cd frontend && npm test -- --watchAll=false
```

## Structure

- **tests/backend/** – Integration tests against the live API and unit tests for middleware and dataController.
  - `api.integration.test.js` – All GET/POST routes: health, projects, experiences, involvements, honors, year-in-review, skills, skill components, feeds, images, collection-counts, dynamic-images, must-load-images; protected routes (401); by-link 404s; addLike validation and 404; AI routes (ask-chat, optimize-query, suggestFollowUpQuestions, snapshotMemoryUpdate); admin (compareAdminName, compareAdminPassword, compareOTP); logout; GitHub stats/top-langs; response shape and list structure.
  - `middleware.test.js` – verifyJWT (401 no token, 403 invalid token, sets request.user when valid). Uses `__mocks__/jsonwebtoken.js` and `moduleNameMapper` in Jest config.
  - `dataController.test.js` – Unit tests with mocked `getDB`: logoutAdmin (clearCookie + success message), addLike (400 missing type/title, 400 invalid type, 200 on modifiedCount 1, 404 on modifiedCount 0). Uses fake timers and console mock to avoid load-time noise.
- **frontend/src/** – Unit tests next to source: services (variants, ping, project, skill, skillComponent, experience, involvement, honors, yearInReview, icons, eventListenerRegistry), components (Footer, Loading, NavBar, Links, FeedTab). Uses `@testing-library/react` and `@testing-library/jest-dom`; `setupTests.js` loads jest-dom and a global `window.matchMedia` mock. Framer-motion is mocked with props stripped (no DOM warnings); NavBar motion.nav uses `forwardRef` to avoid ref warnings; Loading/FeedTab use `waitFor` so async state updates are wrapped in act (no act warnings).

## Environment

- Backend tests use `process.env.API_BASE_URL` or default `http://localhost:5000`.
- Frontend tests use Jest and (optionally) `REACT_APP_API_URI` mock.
