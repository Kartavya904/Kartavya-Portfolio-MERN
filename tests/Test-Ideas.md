## Scope

This file lists **additional tests we can add** on top of the existing suite, for **both backend and frontend**. It’s meant as a backlog / checklist, not as code, and assumes we do **not** change implementation unless explicitly noted.

Sections are organized by:

- **Backend**: server, routes, controllers, images/AI/metrics, auth.
- **Frontend**: services, pages, special components, window modals, AI/admin flows, accessibility.

Where useful, ideas are tagged as:

- **integration**: hits real HTTP endpoints / renders full components.
- **unit**: tests a function/component with mocks.
- **contract**: verifies shape/semantics of responses or props.

---

## Backend – additional tests to add

### 1. Server & infrastructure

- **Server startup (unit-ish / smoke)**  
  - Require `backend/server.js` in a test with **fake timers** and assert that:
    - CORS is registered with expected origins and methods (via Fastify’s `app.printRoutes` or plugin hooks, if we choose to expose them).
    - Cookie and formbody plugins are registered (at least that `app.hasDecorator('cookies')` etc., if available).
  - Verify `onSend` hook sets `Cache-Control: no-store` for `/api/*` routes (using a small Fastify instance started in test mode instead of the full app).  

- **Metrics hook behavior (unit)** – if we refactor metrics into a helper:
  - Given a fake request/response pair, ensure:
    - `totalApiCalls` increments.
    - Per-route stats (`routeStats[route]`) collect methods, status codes, IPs, platforms, browsers, total latency.
  - Memory stats rolling averages updated as expected over multiple simulated requests.

> Note: these require small refactors (exporting helpers), so they’re “later” items, not immediate.

### 2. Data routes (`backend/routes/dataRoutes.js`)

We currently cover **GET** list endpoints and some auth/error paths. Missing integration/unit coverage:

- **Protected CRUD endpoints (integration, with JWT)**  
  Using a known valid JWT (or setting `request.user` via Fastify injection):
  - `POST /api/addproject`, `PUT /api/updateproject/:id`, `DELETE /api/deleteproject/:id`:
    - 401/403 when **no token** (already covered partially via `/check-cookie` + `addproject`).
    - 400/404 for invalid `_id` format or non-existent document.
    - 200 success path: document is created/updated/deleted (requires a test DB fixture).
  - Same pattern for:
    - `addinvolvement`, `updateinvolvement/:id`, `deleteinvolvement/:id`
    - `addexperience`, `updateexperience/:id`, `deleteexperience/:id`
    - `addyearinreview`, `updateyearinreview/:id`, `deleteyearinreview/:id`
    - `addhonorsexperience`, `updatehonorsexperience/:id`, `deletehonorsexperience/:id`
    - `addskill`, `updateskill/:id`, `deleteskill/:id`
    - `addskillcomponent`, `updateskillcomponent/:id`, `deleteskillcomponent/:id`

- **Feeds admin endpoints (integration)**  
  - `POST /api/addFeed`, `PUT /api/updateFeed/:id`, `DELETE /api/deleteFeed/:id`:
    - Auth: 401/403 when no/invalid JWT.
    - Happy-path creation/update/delete using a test feed document.

- **Admin credentials management (integration)**  
  - `POST /api/setAdminCredentials`:
    - 401 when current password is incorrect.
    - 404 when no admin doc exists.
    - 200 when credentials are updated; subsequent `compareAdminName/compareAdminPassword` succeed with new values.

### 3. Data controllers (`backend/controllers/dataController.js`)

We now have **unit tests for `addLike` and `logoutAdmin`**. Additional unit tests (via mocked `getDB`) that we can add:

- **By-link getters**  
  For each of:
  - `getProjectByLink`
  - `getInvolvementByLink`
  - `getExperienceByLink`
  - `getYearInReviewByLink`
  - `getHonorsExperienceByLink`

  Unit tests should cover:
  - When `getDocumentByLink` returns a document → `reply.send(doc)`.
  - When it returns `null` → 404 with the correct `"xxx not found"` message.
  - When it throws → 500 with the appropriate error message.

- **List getters with caching**  
  Using mocks for `getCachedAllDocuments` / `getDB`:
  - `getProjects`, `getInvolvements`, `getExperiences`, `getYearInReviews`, `getHonorsExperiences`, `getSkills`, `getSkillComponents`, `getFeeds`:
    - 200 and array when DB returns data.
    - 500 with correct `Error fetching ...` message when DB throws.

- **Admin compare methods (unit)**  
  - `compareAdminName`:
    - 404 when no admin doc exists.
    - 200 `{ success: true }` when bcrypt compare passes.
    - 401 when bcrypt compare fails (incorrect username).
  - `compareAdminPassword`:
    - 404 when admin not found.
    - 401 when bcrypt compare fails.
    - 200 when correct password → OTP doc inserted into `KartavyaPortfolioOTP` with expireTime ~5 minutes.
  - `compareOTP`:
    - 400 `"Invalid OTP"` when OTP mismatch.
    - 400 `"OTP expired"` when expired.
    - 200 success path: JWT is signed with correct `expiresIn` based on `rememberMe`, `setCookie` called with expected options, OTP doc deleted.

- **GitHub stats / top languages (unit with mocks)**  
  - `getTopLanguages` + cache functions:
    - Mock `fetchAllRepos` and `fetchRepoLanguages` to return known language byte counts and assert final percentage map.
    - 500 path when `fetchAllRepos` throws; error message shape is as expected.

- **Collection counts (unit)**  
  - `getCollectionCounts`:
    - Returns an object with numeric counts for the configured collections, using mocked `db.collection(...).countDocuments`.
    - 500 on DB error with proper message.

### 4. Images controller (`backend/controllers/imagesController.js`)

Current integration tests only ping the route; unit tests can deeply verify behavior with mocks and in-memory file system:

- **`fetchAllImagesData` (unit)**  
  - For each configured collection, given docs with string or array image fields, ensure the resulting structure groups by sanitized title and includes all image URLs.
  - No docs → empty structure.

- **`getAllImages` (unit/integration)**  
  - 200 and well-formed JSON structure (collections → itemTitle → [urls]) when DB returns normally.
  - 500 when DB throws, with proper error message.

- **`downloadAllImages` / `compressAllImages` / `compressImageFolder` (unit)**  
  - With `fs`, `path`, `sharp`, and `fetch` **mocked**, test that:
    - Correct local paths or remote URLs are read.
    - Sharp is invoked with expected options (e.g. resize/compression).
    - Response payload includes summary metadata (counts, bytes saved) as expected.

### 5. AI routes (`backend/routes/aiRoutes.js`)

We only test **error paths** via integration. Additional tests (with mocks) we can add:

- **Happy-path unit tests with mocked AI functions**  
  - `POST /ask-chat`:
    - With non-empty query, mock `askLLM` to return `"answer"` and assert `{ answer: "answer" }` response.
  - `POST /suggestFollowUpQuestions`:
    - With valid `query` and `response`, mock `suggestFollowUpQuestions` to return an array; assert response shape `{ suggestions: [...] }`.
  - `POST /snapshotMemoryUpdate`:
    - Valid `previousMemory`, `query`, `response` → mock `snapshotMemoryUpdate` and assert `{ memory: ... }`.
  - `POST /optimize-query`:
    - Valid `query` and optional `conversationMemory` → mock `optimizeQuery` and assert `{ optimizedQuery: ... }`.

> These can be done by unit-testing `aiRoutes` as a Fastify plugin with injected mocks instead of hitting live LLMs.

### 6. Images & AI route prefixes (`/api/images/`, `/api/ai/`)

Already tested for “routes are working” messages; additional integration/contract tests we can add later:

- **Contract tests for route lists**  
  - `/api/images/` returns a stable structure listing child operations or help text.
  - `/api/ai/` returns description of available endpoints, version, etc. (if we extend that route).  

---

## Frontend – additional tests to add

### 1. Pages

These are the top-level sections under `frontend/src/components` that currently have **no direct tests**:

- **`HomePage/HomePage.js` (integration-ish React Testing Library)**  
  - Renders hero content and “Enter Portfolio” behavior:
    - Clicking the entry button scrolls/switches to About section (mock `scrollTo` / intersection logic).
  - Navbar snap/scroll interactions in combination with HomePage content (could be covered via NavBar tests with fake sections in DOM).

- **`AboutPage/AboutPage.js`**
  - Renders biography, stats, and spotlight background (SpotlightBG).  
  - Hover/scroll effects (can be simplified to smoke tests: components render without throwing).

- **`SkillPage/SkillPage.js`, `SkillSection.js`, `SkillGraph.js`, `SkillBG.js`**
  - Renders skills from `skillService` and `skillComponentService` (using mocked services).  
  - Different display modes: graphs, lists, categories.  
  - Verifies that icons from `icons` module are wired correctly for a sample set of skills.

- **`ProjectPage/ProjectPage.js`, `ProjectsListView.js`, `ProjectTab.js`, `GradientBG.js`**
  - With mocked `projectService`, assert:
    - List view shows titles and descriptions, “view more” / link states.
    - Project modal opens when a project is clicked and shows the correct details.
    - Handling of missing `projectImages` or links gracefully.

- **`ExperiencePage/*` (`ExperiencePage.js`, `CareerTabPage.js`, `InvolvementTabPage.js`, `HonorsTabPage.js`, `Background.js`)**
  - With mocked services, verify:
    - Each tab shows the correct section data (career, involvement, honors).
    - Switching tabs updates the visible list and preserves scroll-to behavior.

- **`ContactPage/ContactPage.js`**
  - Form rendering:
    - All inputs (name, email, subject, message) present, with required attributes where appropriate.
  - Validation behavior:
    - Prevents submit when required fields are empty; shows inline error messages (if implemented).
  - Submission behavior:
    - With mocked email/send service (or `emailjs`) assert success and error flows (toast, message, reset).

### 2. Special components (beyond those already tested)

Already have tests for **Footer**, **NavBar**, **Loading**, **Links**, **FeedTab**. Missing:

- **`SpecialComponents/LikeButton.js`**
  - Props contract:
    - Renders outlined vs filled icon based on `liked` state.
    - Calls `onLikeSuccess` when the fetch to `/addLike` succeeds (mock global `fetch`).
  - Error path:
    - When fetch rejects or returns non-2xx, shows error state or silently fails without throwing.

- **`SpecialComponents/AdminConsole.js`**
  - With mocked `axios`:
    - Renders collection count statistics from `GET /collection-counts`.
    - Submitting each form (`addProject`, `addExperience`, etc.) issues the correct POST/PUT and handles success/failure.
    - Set admin credentials flow: POST `/setAdminCredentials` request shape.

- **`SpecialComponents/AdminTab.js` (in `WindowModal`)**
  - Mock `axios` and cookie state:
    - Login sequence: `compareAdminName` → `compareAdminPassword` → `compareOTP` sets `loggedIn` state.
    - Handling invalid username/password/OTP responses (shows appropriate error messages).
    - “Remember me” toggles the right payload to `/compareOTP` (rememberMe flag).
    - `/check-cookie` response determines initial logged-in state.
    - `/logout` clears logged-in state.

- **`SpecialComponents/AIChatBot` / `WindowModal/AIChatTab.js` (if present)**  
  - With mocked `axios.post` to `/api/ai/ask-chat`, `/suggestFollowUpQuestions`, `/snapshotMemoryUpdate`, `/optimize-query`:
    - Sending a query displays the user message and the AI answer.
    - Follow-up suggestions render as clickable buttons and send the correct payload.
    - Conversation memory snapshot is updated between turns (internal state evolution).
    - Error handling: network/500 errors show user-friendly messages but don’t break the UI.

- **`SpecialComponents/PowerMode.js`, `DevMode.js`**
  - Toggle behavior:
    - Switching modes updates any flags used by `Loading`, `NavBar`, `Footer` (e.g., battery-saving mode).
    - Verifies side-effects like enabling/disabling heavy animations.

### 3. Window modals

Beyond `FeedTab`, we can cover other tabs in `WindowModal/`:

- **`WindowModal/WindowModal.js`**
  - Renders correct tab content based on props (`activeTab`).
  - Close/minimize/maximize behaviors (if present).

- **`WindowModal/ProjectTab.js`, `ExperienceTab.js`, `InvolvementTab.js`, `HonorsTab.js`, `YearInReviewTab.js`**
  - With mocked service data passed as props:
    - Verify that each tab renders titles, dates, descriptions correctly.
    - Link buttons (e.g. GitHub, demo) have correct `href`, `target`.

- **`WindowModal/AIChatTab.js` (if separate from AIChatBot)**  
  - Similar to AIChatBot tests but scoped to the modal UI.

### 4. Hooks and utilities

- **Custom hooks (if any beyond eventListenerRegistry)**  
  - If there are custom hooks in `frontend/src/hooks` (only one js file is currently present):
    - Use `@testing-library/react-hooks` (or equivalent) to test behavior: initial state, updates, cleanup.

- **Utility functions embedded in components**  
  - Example: `getImageURL` in `FeedTab.js`:
    - Returns empty string for invalid structures (`null`, missing `.data`, non-string `.data`).
    - Returns data URL unchanged when it starts with `data:image`.

### 5. Accessibility & interaction

Once core behavior is covered, add **a11y-focused** tests:

- Use `@testing-library/react` queries by role where possible:
  - Ensure `aria-label`s, `role="button"` vs `<button>` usage is correct.
  - For Links/FeedTab social links, assert `rel="noopener noreferrer"` on external links.

- Keyboard navigation:
  - NavBar: tabbing through links moves focus in the expected order; `Enter` triggers the same handlers as clicks (can simulate key events).
  - WindowModals: Esc closes modal if implemented; focus stays trapped within modal.

---

## 6. CI & meta-tests (later)

When we add CI, we can also consider:

- **Smoke tests** that run **quickly** (subset of the full suite) on every push:
  - Frontend: services + key components (Loading, NavBar, Footer, FeedTab).
  - Backend: middleware + a very small subset of API integration tests (e.g. `/api/ping`, `/api/getprojects`).

- **Full test matrix** on main / nightly:
  - Full backend + frontend suite as described above, potentially with a test MongoDB instance (or mocked layer) seeded with fixtures.

This file can be expanded as we discover more surfaces or as the implementation evolves.

