# Kartavya Portfolio – Bottlenecks & Issues

This document lists **potential bottlenecks, bugs, and improvement areas** identified from browser testing (console/network), code review, and architecture. Items are grouped by severity and area.

**Last exploration:** Browser on http://localhost:3000 with backend on port 5000.

---

## 1. Console / runtime issues (observed in browser)

### 1.1 Duplicate React keys (HomePage – AnimatePresence)

- **What:** Console warning: “Encountered two children with the same key” under `AnimatePresence` in `HomePage`.
- **Where:** `frontend/src/components/HomePage/HomePage.js`: `AnimatePresence` has two direct children—(1) `div.homepage-bg-wrapper` containing `motion.div` with `key={scrollYProgress}`, (2) `section.homepage-container` with **no key**.
- **Why it’s a problem:** `scrollYProgress` is a MotionValue (stable reference); using it as key doesn’t give distinct identities. The second child has no key, so React/AnimatePresence can assign conflicting identities.
- **Fix:** Give explicit string keys to both children of `AnimatePresence`, e.g. `key="home-bg"` for the wrapper and `key="home-content"` for the section. Remove `key={scrollYProgress}` from the inner motion.div (or use a stable string there if needed).

### 1.2 Scroll container position (carousel / scroll component)

- **What:** Console error: “Please ensure that the container has a non-static position, like 'relative', 'fixed', or 'absolute' to ensure scroll offset is calculated correctly.”
- **Where:** Likely from a Framer Motion scroll-based component or a carousel (e.g. HomePage carousel or ProjectPage/SkillPage).
- **Why it’s a problem:** Scroll offset is wrong when the scroll parent doesn’t have a non-static position.
- **Fix:** Find the scroll target (e.g. `useScroll({ target: ref })`) and ensure that element (or its scroll ancestor) has `position: relative`, `fixed`, or `absolute` in CSS.

### 1.3 Preload warnings (must-load images)

- **What:** “The resource …/system-user.webp was preloaded using link preload but not used within a few seconds”; same for `user-icon.svg`.
- **Where:** Loading.js preloads URLs from `GET /api/must-load-images`; backend returns a static list including these paths.
- **Why it’s a problem:** Preloading resources that aren’t used quickly hurts performance (wasted bandwidth/priority) and triggers browser warnings.
- **Fix:** Either (1) remove system-user.webp and user-icon.svg from MUST_LOAD_IMAGES in dataController if they aren’t needed above-the-fold, or (2) use them in the initial view (e.g. Loading screen or hero) so they’re consumed soon after load.

### 1.4 FeedTab list key warning

- **What:** “Each child in a list should have a unique ‘key’ prop” in `FeedTab`.
- **Where:** `frontend/src/components/WindowModal/FeedTab.js`: feed list uses `key={feed._id.$oid}`.
- **Why it’s a problem:** If API returns `_id` as a plain string or a different shape (e.g. no `$oid`), keys can be undefined or duplicated.
- **Fix:** Use a stable unique key: e.g. `key={feed._id?.$oid ?? feed._id ?? id}` or fallback to `feed.feedTitle + id` for safety. Ensure backend always returns a consistent _id shape for feeds.

---

## 2. UX / interaction issues

### 2.1 “Enter Portfolio” button click intercepted

- **What:** During testing, click on “Enter Portfolio” hit another element (e.g. about-description-box) instead.
- **Where:** Home section: the button may be overlapped by another div (e.g. about content) due to stacking order or layout.
- **Fix:** Adjust z-index and/or DOM order so the Enter Portfolio button is on top, or ensure the about section doesn’t overlap the hero (e.g. with proper section height/margin).

### 2.2 Section snapping exclusions

- **What:** NavBar scroll logic excludes snapping for `#contact` and `#projects` (nearest-section snap).
- **Where:** `frontend/src/components/SpecialComponents/NavBar.js` (handleScroll).
- **Note:** This may be intentional (e.g. short sections). If users expect snapping everywhere, consider allowing snap for contact/projects or making the list configurable.

### 2.3 Modal click-outside minimizes and clears AI state

- **What:** Clicking outside the modal minimizes it and clears AI chat history and conversation memory.
- **Where:** WindowModal.js handleClickOutside.
- **Note:** Intentional but potentially surprising; consider a confirmation or “Minimize” vs “Close” so users don’t lose long conversations by accident.

---

## 3. Performance & bottlenecks

### 3.1 Loading gate blocks on must-load images

- **What:** App waits for must-load images to be “ready” (preload links added). Images aren’t necessarily loaded, but the list is fetched.
- **Where:** Loading.js preloadMustLoadImages, setImagesReady(true).
- **Risk:** If `/api/must-load-images` or backend is slow, first paint is delayed.
- **Suggestion:** Consider showing the app after backend/DB ping only, and preloading images in the background without blocking render; or reduce the must-load list to truly critical assets.

### 3.2 No request deduplication for collection fetches

- **What:** Multiple components may call GET /api/getprojects, getexperiences, etc. on mount. Backend caches per collection, but frontend doesn’t deduplicate in-flight requests.
- **Risk:** Redundant network requests on initial load or when many sections mount.
- **Suggestion:** Use a shared data layer (e.g. React Query, SWR, or a simple in-memory cache + single promise per key) so the first request is reused.

### 3.3 AI chat: multiple sequential/parallel API calls per message

- **What:** For each user message: optimize-query → ask-chat; in parallel suggestFollowUpQuestions and snapshotMemoryUpdate; then typewriter loop.
- **Risk:** Four API calls per message (optimize, ask, suggest, snapshot); any slow call delays UX. Quota (e.g. 20/day) is per user (localStorage), so it’s client-only and can be bypassed.
- **Suggestion:** Consider batching or moving follow-up/memory to a single backend flow; enforce quota on the server if needed.

### 3.4 Large bundle (lazy loading already used)

- **What:** Major sections and WindowModal are lazy-loaded, which is good. Remaining bundle still includes Framer Motion, Chart.js, carousels, etc.
- **Suggestion:** Monitor bundle size; consider lazy-loading heavy libs (e.g. Chart.js) only in SkillPage if possible.

### 3.5 Backend: in-memory caches not shared across instances

- **What:** dataController uses in-memory caches (collection lists, must-load/dynamic images, collection counts, GitHub top-langs). If the app runs multiple instances (e.g. Render with replicas), each has its own cache.
- **Risk:** Cache stampede or inconsistency after writes if load balancer hits different instances.
- **Suggestion:** For multi-instance deployments, consider a shared cache (e.g. Redis) or short TTLs and accept eventual consistency.

---

## 4. Security & robustness

### 4.1 JWT in cookie (good) – ensure CORS and cookie options

- **What:** JWT is in httpOnly, secure, sameSite: none cookie. CORS allows specific origins with credentials.
- **Suggestion:** Verify in production that only intended origins are in the list and that HTTPS is enforced so the cookie is always secure.

### 4.2 Admin OTP in DB, single document

- **What:** OTP stored in KartavyaPortfolioOTP; one document; 5-minute expiry. compareOTP deletes after use.
- **Risk:** If multiple OTP requests happen, only the latest is valid; acceptable. Ensure OTP collection is not exposed.

### 4.3 AI quota only in localStorage

- **What:** queriesSent is stored in localStorage and checked in App before sending. Backend doesn’t enforce per-user quota.
- **Risk:** Users can clear storage or use another device and get more than the intended limit.
- **Suggestion:** If quota must be strict, enforce it server-side (e.g. by IP or by a lightweight anonymous id in cookie) and return 429 when exceeded.

### 4.4 Feed delete is hard delete

- **What:** deleteFeed does deleteOne; other entities use soft delete (deleted: true).
- **Where:** dataController.deleteFeed.
- **Note:** Intentional or oversight; if feeds should be recoverable, switch to soft delete.

---

## 5. Data & API

### 5.1 Feed _id shape

- **What:** Frontend expects feed._id.$oid (MongoDB extended JSON). If the API returns raw ObjectId or string, FeedTab keys and any _id usage can break.
- **Where:** FeedTab.js, backend getFeeds (MongoDB driver returns _id as ObjectId by default unless serialized).
- **Fix:** Ensure GET /api/getFeeds serializes _id consistently (e.g. to { $oid: "..." } for JSON) or document the shape and use a safe key in FeedTab (see 1.4).

### 5.2 ObjectId handling in dataController

- **What:** getObjectId(id) supports numeric string (timestamp) and 24-char hex. Some routes use request.params.id from client; if client sends something else, could throw.
- **Where:** dataController.js getObjectId, used in update/delete handlers.
- **Suggestion:** Validate params and return 400 for invalid id format instead of throwing.

### 5.3 GitHub top-langs and GITHUB_TOKEN

- **What:** getTopLanguages uses GITHUB_TOKEN; if token is missing or expired, cache update fails and the endpoint may return stale or empty data.
- **Suggestion:** Log token errors and optionally return a cached response or a clear “unavailable” message.

---

## 6. Accessibility & SEO

### 6.1 Loading screen and accessibility

- **What:** Loading state shows “Connecting to Backend”, “Connecting to Database”, “Loading Must-Load Images (0/0)”. Ensure screen readers announce loading state and completion.
- **Suggestion:** Use aria-live and role="status" (or similar) and ensure “Enter Portfolio” / main content is focusable and announced when ready.

### 6.2 Navbar “Menu” and mobile

- **What:** Navbar toggler has aria-expanded; menu open/close should be keyboard- and screen-reader friendly.
- **Suggestion:** Verify focus trap in open menu and Escape to close.

### 6.3 Contact form

- **What:** Required fields have placeholder “*”; ensure labels are associated and errors are announced.
- **Suggestion:** Use proper <label>, aria-required, and aria-invalid where applicable.

---

## 7. Maintenance & ops

### 7.1 Hourly metrics reset

- **What:** Server logs hourly metrics and resets in-memory counters. Good for observability; no persistent metrics store.
- **Suggestion:** If you need history, push to a logging/monitoring service or DB.

### 7.2 AI context and index build

- **What:** buildMemoryIndex and context updates (DB, GitHub, resume) run on startup and on schedule. If MongoDB or GitHub is down at startup, initContext could fail and crash the process.
- **Where:** server.js initContext(), aiContextManager initContext.
- **Suggestion:** Consider retries or starting the server with a “degraded” mode (e.g. no AI) if index build fails, so the rest of the API still works.

### 7.3 Resume PDF path

- **What:** aiContextManager uses a hardcoded path to Singh_Kartavya_Resume2026.pdf in backend/data. If the file is renamed or missing, resume context is empty or errors.
- **Suggestion:** Use env var or config for resume path and handle missing file gracefully.

---

## 8. Summary table

| # | Issue | Severity | Area |
|---|--------|----------|------|
| 1.1 | AnimatePresence duplicate keys (HomePage) | Medium | Frontend |
| 1.2 | Scroll container non-static position | Medium | Frontend |
| 1.3 | Preload unused (system-user.webp, user-icon.svg) | Low | Frontend / Backend |
| 1.4 | FeedTab list key (feed._id) | Medium | Frontend |
| 2.1 | Enter Portfolio click intercepted | Medium | Frontend (layout) |
| 2.2 | Section snapping exclusions | Low | Frontend |
| 2.3 | Modal click-outside clears AI | Low (UX) | Frontend |
| 3.1 | Loading gate blocks on must-load | Low | Frontend |
| 3.2 | No request deduplication | Low | Frontend |
| 3.3 | AI multiple calls + client-only quota | Medium | Full stack |
| 3.4 | Bundle size | Low | Frontend |
| 3.5 | In-memory cache multi-instance | Low | Backend |
| 4.3 | AI quota client-only | Medium | Backend |
| 4.4 | Feed hard delete | Low | Backend |
| 5.1 | Feed _id shape | Medium | Full stack |
| 5.2 | ObjectId validation | Low | Backend |
| 5.3 | GitHub token failure handling | Low | Backend |
| 6.x | A11y (loading, menu, form) | Low | Frontend |
| 7.2 | AI init failure crashes server | Medium | Backend |
| 7.3 | Resume path hardcoded | Low | Backend |

Fixing 1.1, 1.2, 1.4, and 2.1 will remove the observed console warnings and the main interaction bug. Addressing 3.3 and 4.3 improves reliability and fairness of the AI feature. The rest are incremental improvements and hardening.

For feature list and locations, see `Miscellaneous/Website-In-Depth-Exploration.md`. For implementation details, see `Miscellaneous/Website-Summary.md`.
