# Kartavya Portfolio – Website Summary (Master Reference)

**Purpose:** Single source of truth for the entire Kartavya portfolio codebase. Use this file to locate any component, API, data flow, or architectural decision. Suitable for developers and AI agents that need to understand or modify the project.

**Live URL:** https://www.kartavya-singh.com

---

## 1. Overview

- **What it is:** Personal portfolio for Kartavya Singh: home, about, skills, projects, experience, contact, feed, and an AI companion. No React Router; navigation is hash/section-based with smooth scroll and section snapping.
- **Monorepo layout:** `frontend/` (React CRA), `backend/` (Fastify Node API), `Miscellaneous/` (docs/assets).
- **Root:** `d:\Desktop\All Projects\Kartavya-Portfolio-MERN\` (or repo root).

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 (Create React App) — entry: `frontend/src/index.js`, root component: `frontend/src/App.js`.
- **Build:** `react-scripts` 5.0.1; proxy in dev: `http://localhost:5000` (see `frontend/package.json`).
- **Animation:** Framer Motion 12.x (`motion`, `AnimatePresence`), `@react-spring/web` for some animated elements.
- **Charts/visuals:** Chart.js 4.x, react-chartjs-2; carousels: react-multi-carousel, Swiper, Glide.js, slick-carousel.
- **HTTP:** Axios; API base from `process.env.REACT_APP_API_URI`.
- **Other:** react-markdown + remark-gfm, react-syntax-highlighter, react-type-animation, p5, EmailJS (@emailjs/browser), react-icons.
- **Fonts:** Montserrat (Bold/Medium/Regular) in `frontend/src/assets/font/`.

### Backend
- **Runtime:** Node.js; server entry: `backend/server.js`.
- **Framework:** Fastify 5.x (logger off, body limit 50MB).
- **Plugins:** @fastify/cors, @fastify/cookie, @fastify/formbody.
- **Database:** MongoDB driver 6.x; two databases (primary + AI) — see `backend/config/mongodb.js`.
- **Auth:** JWT (jsonwebtoken), bcryptjs; cookies: httpOnly, secure, sameSite: none.
- **AI:** OpenAI client 4.x (`backend/config/openai.js`); RAG/embeddings and conversation memory in `backend/controllers/aiContextManager.js`.
- **Other:** dotenv, express-useragent (for metrics), node-fetch, pdf-parse, sharp (images), puppeteer, winston.

---

## 3. Project Structure (File-Level)

### Frontend (`frontend/`)

```
frontend/
├── public/
│   ├── index.html              # HTML shell, meta, Font Awesome, root div
│   ├── favicon.ico, favicon.gif
│   ├── home-bg.webp, contact-bg.webp, Kartavya.webp, Kartavya-Profile-Photo.webp
│   ├── system-user.webp, user-icon.png, user-icon.svg
│   └── robots.txt
├── src/
│   ├── index.js                # Root: ReactDOM.createRoot, Loading gate, then App
│   ├── App.js                  # Top-level layout, lazy sections, tabs, AI chat state & sendQuery
│   ├── App.css
│   ├── index.css
│   ├── assets/
│   │   ├── font/               # Montserrat *.ttf
│   │   ├── img/icons/          # aichat, github, react, etc. (svg/png)
│   │   └── Singh_Kartavya_Resume*.pdf
│   ├── components/
│   │   ├── HomePage/           # HomePage.js
│   │   ├── AboutPage/          # AboutPage.js, SpotlightBG.js
│   │   ├── SkillPage/          # SkillPage.js, SkillSection.js, SkillGraph.js, SkillBG.js
│   │   ├── ProjectPage/        # ProjectPage.js, ProjectsListView.js, GradientBG.js
│   │   ├── ExperiencePage/     # ExperiencePage.js, CareerTabPage, HonorsTabPage, InvolvementTabPage, Background.js
│   │   ├── ContactPage/        # ContactPage.js
│   │   ├── SpecialComponents/
│   │   │   ├── NavBar.js       # Hash nav, smooth scroll, active link, Feed/AI/Admin triggers
│   │   │   ├── Links.js        # Floating links
│   │   │   ├── Footer.js
│   │   │   ├── Loading.js      # Preload gate: ping backend/DB, must-load images, battery/motion
│   │   │   ├── PowerMode.js    # Battery saver / reduced motion
│   │   │   ├── LikeButton.js
│   │   │   ├── AdminConsole.js
│   │   │   └── DevMode.js
│   │   └── WindowModal/
│   │       ├── WindowModal.js  # Tab container, minimize/restore, body scroll lock
│   │       ├── ProjectTab.js, ExperienceTab.js, InvolvementTab.js, HonorsTab.js
│   │       ├── YearInReviewTab.js, FeedTab.js, AIChatTab.js, AdminTab.js
│   │       └── ImageCarousel.js
│   ├── hooks/
│   │   └── useSpeechInput.js
│   ├── services/
│   │   ├── variants.js         # Framer Motion variants (AppLoad, fadeIn, slideIn, zoomIn, etc.)
│   │   ├── ping.js             # pingBackend, pingDatabase (used by Loading)
│   │   ├── projectService.js, experienceService.js, honorsExperienceService.js
│   │   ├── involvementService.js, yearInReviewService.js
│   │   ├── skillService.js, skillComponentService.js
│   │   ├── icons.js, eventListenerRegistry.js
│   │   └── (App imports AppLoad from ./services/variants)
│   └── styles/
│       ├── AboutPage.css, AdminConsole.css, AdminTab.css, AIChatBot.css
│       ├── ContactPage.css, ExperiencePage.css, FeedTab.css, Footer.css
│       ├── HomePage.css, LikeButton.css, Links.css, Loading.css
│       ├── NavBar.css, PowerMode.css, ProjectPage.css, ProjectsListView.css
│       ├── ProjectTab.css, SkillPage.css, SkillSection.css, SkillGraph.css
│       └── WindowModal.css
└── package.json, obfuscator.config.json
```

### Backend (`backend/`)

```
backend/
├── server.js                   # Fastify app, CORS, cookies, formbody, metrics hooks, route registration
├── config/
│   ├── mongodb.js              # connectDB, getDB, getDBAI, proxy for ops metrics
│   └── openai.js               # OpenAI client from OPENAI_API_KEY
├── routes/
│   ├── dataRoutes.js           # All portfolio CRUD, admin auth, GitHub stats, images list (prefix /api)
│   ├── aiRoutes.js             # AI: create-index, ask-chat, suggestFollowUpQuestions, snapshotMemoryUpdate, optimize-query (prefix /api/ai)
│   └── imagesRoutes.js         # get_all_images, download_all_images, compress_* (prefix /api/images)
├── controllers/
│   ├── dataController.js       # CRUD for all collections, caches, admin auth, GitHub top-langs
│   ├── aiContextManager.js     # RAG: context snapshots, memory index, askLLM, follow-ups, memory snapshot, optimizeQuery
│   ├── middlewareController.js # verifyJWT (cookie token)
│   └── imagesController.js     # getAllImages, downloadAllImages, compressAllImages, compressImageFolder
├── data/
│   ├── Singh_Kartavya_Resume2026.pdf   # Used for AI resume context
│   ├── Images/
│   │   ├── downloaded_images/  # Per-collection, per-title folders (from download_all_images)
│   │   ├── compressed_images/  # WebP output (compress_all_images)
│   │   └── ImagesToCompress/    # compress_image_folder source
│   └── (other static assets)
└── package.json
```

---

## 4. Frontend Deep Dive

### 4.1 Entry and loading gate
- **File:** `frontend/src/index.js`
- **Flow:** Renders `Root`. Until `isReady` is true, renders `Loading`; `Loading` pings backend/DB, preloads must-load images via `REACT_APP_API_URI/must-load-images`, optionally detects battery/motion preferences and sets `isBatterySavingOn`. On completion it calls `onComplete()` → `setIsReady(true)` → renders `App` with `isBatterySavingOn` and `setIsBatterySavingOn`.

### 4.2 App.js – state and orchestration
- **File:** `frontend/src/App.js`
- **State:** `scrolled`, `loggedIn`, `tabs`, `isClosed`, `isMinimized`, `lastActiveIndex`, `isWindowModalVisible`; full AI chat state: `chatStarted`, `chatHistory`, `loading`, `query`, `interimQuery`, `followUpSuggestions`, `conversationMemory`, `latestAIId`, `errorMsg`, `queriesSent`; `cancelRef` for aborting generation.
- **Constants:** `API_URL = process.env.REACT_APP_API_URI`, `MAX_QUERIES = 20`, `TYPING_DELAY = 0`.
- **Lazy-loaded sections:** HomePage, AboutPage, SkillPage, ProjectPage, ExperiencePage, ContactPage, WindowModal (all via `React.lazy` + `Suspense` with fallback `null`).
- **addTab(type, data):** Adds or focuses a modal tab (max 3 tabs; types include ProjectTab, ExperienceTab, InvolvementTab, HonorsTab, YearInReviewTab, FeedTab, AIChatTab, AdminTab). Tab name comes from `data.title` or `data.projectTitle` / `data.experienceTitle` / etc.
- **AI chat flow (sendQuery):**
  1. Insert user message, then AI placeholder “Thinking…”.
  2. POST `API_URL/ai/optimize-query` with `query`, `conversationMemory` → get `optimizedQuery`.
  3. Update placeholder to “Gathering Context…”, then POST `API_URL/ai/ask-chat` with `optimizedQuery`, `conversationMemory`.
  4. Update to “Generating Response…”; on response, in parallel: POST `api/ai/suggestFollowUpQuestions` and POST `api/ai/snapshotMemoryUpdate`; then typewriter reveal (3 chars per tick when TYPING_DELAY allows), store new memory in state and `localStorage`, increment `queriesSent` (and persist), show follow-up suggestions.
- **stopGenerating:** Sets `cancelRef.current = true`, appends “[Generation stopped]” to latest AI message, clears loading.
- **Layout:** PowerMode, NavBar, then each section in order; Links; floating AI chat button (opens AIChatTab via addTab); WindowModal receives all tab and AI state.

### 4.3 NavBar
- **File:** `frontend/src/components/SpecialComponents/NavBar.js`
- **Styles:** `frontend/src/styles/NavBar.css`
- **Behavior:** Fixed navbar; links target sections by `id` (e.g. `#home`, `#about`). `scrollToSection(id)` smooth-scrolls with offset 52px. On scroll, active link is derived from section positions; optional section snapping (nearest section within 180px after 1s debounce) for sections other than contact/projects. Can open Feed or AI Companion or Admin via `addTab` (e.g. FeedTab, AIChatTab, AdminTab). Mobile: hamburger menu.

### 4.4 Section components (where to change page content)
- **Home:** `frontend/src/components/HomePage/HomePage.js` — hero, CTA, can pass `addTab`, `sendQuery`.
- **About:** `frontend/src/components/AboutPage/AboutPage.js` + `SpotlightBG.js`; styles: `AboutPage.css`.
- **Skills:** `frontend/src/components/SkillPage/SkillPage.js`; uses `SkillSection.js`, `SkillGraph.js`, `SkillBG.js`; data from `getskillcomponents` / `getskills` (e.g. via `skillComponentService`, `skillService`); styles: `SkillPage.css`, `SkillSection.css`, `SkillGraph.css`.
- **Projects:** `frontend/src/components/ProjectPage/ProjectPage.js`, `ProjectsListView.js`, `GradientBG.js`; list/grid of projects, clicking opens ProjectTab with project data; styles: `ProjectPage.css`, `ProjectsListView.css`.
- **Experience:** `frontend/src/components/ExperiencePage/ExperiencePage.js`; sub-views: CareerTabPage, HonorsTabPage, InvolvementTabPage; styles: `ExperiencePage.css`; opening an item opens ExperienceTab / InvolvementTab / HonorsTab.
- **Contact:** `frontend/src/components/ContactPage/ContactPage.js`; styles: `ContactPage.css`.
- **Feed:** Shown inside WindowModal as FeedTab; data from `getFeeds`; styles: `FeedTab.css`.

### 4.5 WindowModal and tabs
- **File:** `frontend/src/components/WindowModal/WindowModal.js`; styles: `frontend/src/styles/WindowModal.css`
- **Props:** `tabs`, `addTab`, `setTabs`, `isClosed`, `setIsClosed`, `isMinimized`, `setIsMinimized`, `lastActiveIndex`, `setLastActiveIndex`, plus all AI chat state and handlers from App.
- **Behavior:** Renders tab bar and content by `tabs[lastActiveIndex].type` (ProjectTab, ExperienceTab, InvolvementTab, HonorsTab, YearInReviewTab, FeedTab, AIChatTab, AdminTab). When modal is open and not minimized, `setIsWindowModalVisible(true)`; on minimize or click-outside (with exceptions for feed-nav, ai-chat-nav, navbar-toggler), minimizes and clears AI chat state. Toasts for minimize/restore; body scroll locked when modal is open (implementation in CSS/JS as needed).
- **Tab components:** Each in `frontend/src/components/WindowModal/`: ProjectTab, ExperienceTab, InvolvementTab, HonorsTab, YearInReviewTab, FeedTab, AIChatTab, AdminTab; ImageCarousel used for media in tabs.

### 4.6 Services (data fetching / helpers)
- **Location:** `frontend/src/services/`
- **variants.js:** Framer Motion variant factories: `AppLoad`, `fadeIn`, `slideIn`, `zoomIn`, `rotate`, etc. Used by App and section components.
- **ping.js:** `pingBackend`, `pingDatabase` — used by Loading to decide when backend/DB are ready.
- **projectService, experienceService, honorsExperienceService, involvementService, yearInReviewService:** Typically call `REACT_APP_API_URI` endpoints like `getprojects`, `getexperiences`, etc.
- **skillService, skillComponentService:** Call `getskills`, `getskillcomponents`.
- **icons.js:** Mapping of skill or entity names to icon paths (e.g. under `assets/img/icons/`).
- **eventListenerRegistry.js:** Optional cleanup of event listeners (referenced in commented code in App).

### 4.7 Hooks
- **useSpeechInput.js:** `frontend/src/hooks/useSpeechInput.js` — speech input for accessibility or AI chat if wired.

### 4.8 Battery saver / Power mode
- **PowerMode.js:** Reads `isBatterySavingOn`; when on, animations can be disabled or reduced (e.g. Framer Motion variants become no-ops in some components). Loading screen can set `isBatterySavingOn` based on battery or `prefers-reduced-motion`.

---

## 5. Backend Deep Dive

### 5.1 Server bootstrap
- **File:** `backend/server.js`
- **Order:** Load dotenv → connectDB() → register routes (dataRoutes at `/api`, aiRoutes at `/api/ai`, imagesRoutes at `/api/images`) → `aiContextManager.initContext()` → listen on PORT (default 5000), host `0.0.0.0`.
- **CORS:** Allowed origins include Render frontend URL, `https://kartavya-singh.com`, `http://localhost:3000`, `http://localhost:3001`; credentials true.
- **Cookies:** path `/`, secure, httpOnly, sameSite `none`.
- **Cache-Control:** For any URL starting with `/api`, reply sets `Cache-Control: no-store`.
- **Metrics:** onRequest/onResponse hooks track per-route stats (count, methods, status codes, IPs, devices, browsers, latency), memory samples, total API calls, unique IPs. Every 1 hour: log summary (RSS, heap, CPU, handles, uptime, DB conns, storage, top collection by ops) and reset counters; DB metrics from `getDBMetrics()` and optional `db.admin().serverStatus()`.

### 5.2 Config
- **mongodb.js:** Single MongoClient; two DBs: primary (`MONGO_DB_NAME` / default `KartavyaPortfolioDB`), AI (`MONGO_DB_NAME_AI` / default `KartavyaPortfolioDBAI`). Proxies on `getDB()`/`getDBAI()` wrap collection methods (find, findOne, insertOne, updateOne, deleteOne, etc.) to increment `dbOpsCount` and `dbOpsByCollection[collName]`. Exports: `connectDB`, `getDB`, `getDBAI`, `getDBMetrics`, `resetDBMetrics`, `getPrimaryDBName`, `getAIDBName`.
- **openai.js:** `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`.

### 5.3 Data controller (portfolio + admin + GitHub)
- **File:** `backend/controllers/dataController.js`
- **Caching:** In-memory caches with TTL (e.g. 24h for collection lists). `getCachedAllDocuments(collectionName)`; on POST/PUT/DELETE, `clearCacheForCollection(collectionName)`. Separate caches: must-load images (static list), dynamic images (from DB image fields), collection counts, GitHub top-languages (scheduled daily at 12 AM EST).
- **Must-load images:** Static array (e.g. `/home-bg.webp`, `/Kartavya.webp`, …); endpoint returns it (cache updated on interval).
- **Dynamic images:** Aggregated from collections: experienceTable (experienceImages), honorsExperienceTable, involvementTable, projectTable, yearInReviewTable, FeedTable (feedImageURL); endpoint returns unique URLs.
- **CRUD pattern:** For each entity: get all (cached), get by link (e.g. projectLink), add (verifyJWT), update (verifyJWT), delete (soft delete: `deleted: true`); cache cleared on write. Collections: projectTable, involvementTable, experienceTable, yearInReviewTable, honorsExperienceTable, skillsCollection, skillsTable, FeedTable.
- **Feeds:** getFeeds, addFeed (validate feedTitle, feedCategory), editFeed, deleteFeed (hard delete). addLike(type, title): maps type to collection/titleField and $inc likesCount.
- **Admin:** compareAdminName (bcrypt compare userName to KartavyaPortfolio.userName), compareAdminPassword (bcrypt compare password, then create OTP in KartavyaPortfolioOTP, 5 min expiry), compareOTP (verify OTP, issue JWT, set cookie; rememberMe → 365d else 1h), logoutAdmin (clear cookie), setAdminCredentials (verifyJWT + currentPassword, then replace hashed userName/password in KartavyaPortfolio).
- **GitHub:** getTopLanguages uses GITHUB_TOKEN to fetch user repos and repo languages, aggregates top 6 languages by byte share, caches until next 12 AM EST. Route `/top-langs` proxies SVG from github-readme-stats (e.g. username Kartavya904).
- **getCollectionCounts:** Returns document counts per collection (cached); used by admin dashboard.

### 5.4 Middleware (auth)
- **File:** `backend/controllers/middlewareController.js`
- **verifyJWT:** PreHandler that reads `request.cookies.token`, verifies with `JWT_SECRET`; on success sets `request.user`; on failure replies 401/403.

### 5.5 AI context manager (RAG + memory)
- **File:** `backend/controllers/aiContextManager.js`
- **Context sources:** (1) DB snapshot: experienceTable, honorsExperienceTable, involvementTable, projectTable, skillsCollection, skillsTable, yearInReviewTable (aggregated, no _id/images/links/likes); (2) GitHub: repo list + READMEs; (3) Resume: PDF text from `backend/data/Singh_Kartavya_Resume2026.pdf`.
- **AI DB collections:** contextMeta (single doc), dbContexts (current snapshot), githubContexts, resumeContexts, memoryIndex (chunks with category, text, embedding), plus Atlas Search index `chunkEmbeddingsIndex` if using Atlas vector search.
- **Chunking:** DB items chunked per table (e.g. JSON per item); DB/github/resume text chunked and stored with category. Embeddings: OpenAI embeddings (dimensions 1536).
- **Prioritization:** CATEGORY_WEIGHTS (db 0.7, resume 0.3, github 0.1); query boosts; DB_TERMS; MAX_COUNTS per category; TOTAL_BUDGET (e.g. 12 chunks); MIN_SCORE_THRESH; MAX_CONTEXT_CHARS 8000. Budget allocation by signal (sum of weighted scores) then take top chunks per category.
- **askLLM(query, conversationMemory):** Load memory index if empty; embed query; cosine similarity to all chunks; weight by category and query terms; filter/boost by DB_TERMS and resume headings; allocate budget; build context string; call OpenAI (model gpt-4.1-nano) with system prompt (Kartavya first-person, context-only, recency, etc.) and user prompt (memory + context + question); return assistant message.
- **optimizeQuery(conversationMemory, userQuery):** LLM call to turn user query into a standalone, context-optimized question.
- **suggestFollowUpQuestions(query, answer, conversationMemory):** LLM returns exactly three follow-up questions.
- **snapshotMemoryUpdate(previousMemory, query, answer):** LLM produces a short conversation memory summary; returned and stored on client (e.g. localStorage).
- **buildMemoryIndex(forceRebuild):** Rebuilds chunks from db/github/resume contexts, (re)embeds, writes to memoryIndex (and optionally Atlas index).
- **initContext:** Load contextMeta and memoryIndex meta; update DB/github/resume context files; build memory index; schedule daily rebuild (~5.083 UTC).

### 5.6 Images controller
- **File:** `backend/controllers/imagesController.js`
- **Collections config:** experienceTable, honorsExperienceTable, involvementTable, projectTable, yearInReviewTable, FeedTable (with image field and title field).
- **getAllImages:** Returns structure { collectionName: { title: [urls] } } from DB.
- **downloadAllImages:** Fetches each URL, saves under `backend/data/Images/downloaded_images/<collection>/<sanitizedTitle>/`; skips existing files.
- **compressAllImages:** Reads downloaded_images, compresses with sharp to WebP (quality 60), writes to `backend/data/Images/compressed_images/`.
- **compressImageFolder:** Reads `backend/data/ImagesToCompress/`, writes WebP to `ImagesToCompress/CompressedImages/`.

---

## 6. API Reference (Quick lookup)

Base: `BACKEND_ORIGIN` (e.g. `https://your-api.onrender.com` or `http://localhost:5000`). Frontend uses `REACT_APP_API_URI`.

### Data routes (prefix `/api`)

| Method | Path | Auth | Handler / purpose |
|--------|------|------|-------------------|
| GET | /check-cookie | JWT | dataController (validates admin cookie) |
| GET | /ping | — | Backend active |
| GET | /db-ping | — | MongoDB active |
| GET | /must-load-images | — | dataController.getMustLoadImages |
| GET | /dynamic-images | — | dataController.getDynamicImages |
| GET | /getprojects | — | getProjects (cached) |
| GET | /getprojects/:projectLink | — | getProjectByLink |
| POST | /addproject | JWT | addProject |
| PUT | /updateproject/:id | JWT | updateProject |
| DELETE | /deleteproject/:id | JWT | deleteProject (soft) |
| GET | /getinvolvements | — | getInvolvements (cached) |
| GET | /getinvolvements/:involvementLink | — | getInvolvementByLink |
| POST/PUT/DELETE | /addinvolvement, /updateinvolvement/:id, /deleteinvolvement/:id | JWT for write | dataController |
| GET | /getexperiences | — | getExperiences (cached) |
| GET | /getexperiences/:experienceLink | — | getExperienceByLink |
| POST/PUT/DELETE | addexperience, updateexperience/:id, deleteexperience/:id | JWT | dataController |
| GET | /getyearinreviews | — | getYearInReviews (cached) |
| GET | /getyearinreviews/:yearInReviewLink | — | getYearInReviewByLink |
| POST/PUT/DELETE | yearinreview… | JWT | dataController |
| GET | /gethonorsexperiences | — | getHonorsExperiences (cached) |
| GET | /gethonorsexperiences/:honorsExperienceLink | — | getHonorsExperienceByLink |
| POST/PUT/DELETE | honorsexperience… | JWT | dataController |
| GET | /getskills | — | getSkills (cached) |
| GET | /getskillcomponents | — | getSkillComponents (cached) |
| POST/PUT/DELETE | addskill, updateskill/:id, deleteskill/:id, addskillcomponent, … | JWT | dataController |
| GET | /getFeeds | — | getFeeds (cached) |
| POST | /addFeed | JWT | addFeed |
| PUT | /updateFeed/:id | JWT | editFeed |
| DELETE | /deleteFeed/:id | JWT | deleteFeed |
| POST | /addLike | — | addLike (body: type, title) |
| POST | /setAdminCredentials | JWT | setAdminCredentials |
| POST | /compareAdminName | — | compareAdminName (body: userName) |
| POST | /compareAdminPassword | — | compareAdminPassword (body: password) |
| POST | /compareOTP | — | compareOTP (body: otp, rememberMe) |
| GET | /logout | — | logoutAdmin (clears cookie) |
| GET | /collection-counts | — | getCollectionCounts (cached) |
| GET | /github-stats/top-langs | — | getTopLanguages (JSON) |
| GET | /top-langs | — | Proxy to GitHub readme-stats SVG |

### AI routes (prefix `/api/ai`)

| Method | Path | Auth | Handler / purpose |
|--------|------|------|-------------------|
| GET | / | — | Health |
| GET/POST | /create-index | — | updateDbContextFile, updateGithubContextFile, updateResumeContextFile, buildMemoryIndex(true) |
| POST | /ask-chat | — | askLLM (body: query; conversationMemory from client) |
| POST | /suggestFollowUpQuestions | — | suggestFollowUpQuestions (body: query, response, conversationMemory) |
| POST | /snapshotMemoryUpdate | — | snapshotMemoryUpdate (body: previousMemory, query, response) |
| POST | /optimize-query | — | optimizeQuery (body: query, conversationMemory) |

### Images routes (prefix `/api/images`)

| Method | Path | Auth | Handler / purpose |
|--------|------|------|-------------------|
| GET | / | — | Health |
| GET | /get_all_images | — | getAllImages |
| GET | /download_all_images | — | downloadAllImages |
| GET | /compress_all_images | — | compressAllImages |
| GET | /compress_image_folder | — | compressImageFolder |

---

## 7. Data Model (MongoDB)

### Primary DB (e.g. KartavyaPortfolioDB)
- **projectTable:** projectTitle, projectLink, projectImages, projectURLs, likesCount, deleted, …
- **experienceTable:** experienceTitle, experienceLink, experienceImages, experienceURLs, likesCount, deleted, …
- **involvementTable:** involvementTitle, involvementLink, involvementImages, …
- **honorsExperienceTable:** honorsExperienceTitle, honorsExperienceLink, honorsExperienceImages, …
- **yearInReviewTable:** yearInReviewTitle, yearInReviewLink, yearInReviewImages, …
- **skillsCollection:** skill categories/groups.
- **skillsTable:** skill components (e.g. name, icon, level).
- **FeedTable:** feedTitle, feedCategory, feedContent, feedImageURL, feedLinks, feedCreatedAt (no soft delete in current deleteFeed).
- **KartavyaPortfolio:** Single doc: hashed userName, password (bcrypt).
- **KartavyaPortfolioOTP:** Single OTP doc: otp, expireTime (cleared after use or expiry).

### AI DB (e.g. KartavyaPortfolioDBAI)
- **contextMeta:** _id "contextMeta", dbContextLastUpdate, githubContextLastUpdate, resumeContextLastUpdate, etc.
- **dbContexts:** _id "current", data (aggregated DB snapshot), createdAt.
- **githubContexts:** _id "current", data (repos + readmes), createdAt.
- **resumeContexts:** _id "current", data (resume_text), createdAt.
- **memoryIndex:** Documents with category, text, embedding (array of 1536 floats); optionally Atlas vector index `chunkEmbeddingsIndex` (knnVector, cosine, dimensions 1536).

---

## 8. Environment and deployment

- **Backend .env:** MONGO_URI, MONGO_DB_NAME, MONGO_DB_NAME_AI, PORT, JWT_SECRET, OPENAI_API_KEY, GITHUB_TOKEN (for GitHub API and top-langs).
- **Frontend .env:** REACT_APP_API_URI (backend base URL for API and must-load-images).
- **Run:** Backend: `npm run dev` (nodemon) or `npm start` (node server.js). Frontend: `npm start` (CRA). Production CORS allows Render and kartavya-singh.com; cookies secure, sameSite none for cross-origin.

---

## 9. File Index (Path → Purpose)

Use this section to jump to the right file for a given concern.

| Concern | Primary file(s) |
|--------|------------------|
| App shell, lazy sections, tab state, AI chat flow | `frontend/src/App.js` |
| Entry, loading gate, battery saver init | `frontend/src/index.js`, `frontend/src/components/SpecialComponents/Loading.js` |
| Nav, smooth scroll, section IDs, open Feed/AI/Admin | `frontend/src/components/SpecialComponents/NavBar.js` |
| Modal, tabs, minimize, body scroll | `frontend/src/components/WindowModal/WindowModal.js` |
| Project list, open project detail | `frontend/src/components/ProjectPage/ProjectPage.js`, `ProjectsListView.js` |
| Experience (career/honors/involvement) | `frontend/src/components/ExperiencePage/ExperiencePage.js`, *TabPage.js` |
| Skills UI and charts | `frontend/src/components/SkillPage/SkillPage.js`, `SkillSection.js`, `SkillGraph.js` |
| About, Contact, Home | `frontend/src/components/AboutPage/AboutPage.js`, `ContactPage/ContactPage.js`, `HomePage/HomePage.js` |
| Feed, AI chat, Admin in modal | `frontend/src/components/WindowModal/FeedTab.js`, `AIChatTab.js`, `AdminTab.js` |
| Motion variants | `frontend/src/services/variants.js` |
| API base, ping | `frontend/src/services/ping.js`; env: REACT_APP_API_URI |
| Server, CORS, cookies, metrics | `backend/server.js` |
| DB connections, primary vs AI | `backend/config/mongodb.js` |
| OpenAI client | `backend/config/openai.js` |
| All portfolio CRUD, admin auth, GitHub, caches | `backend/controllers/dataController.js` |
| JWT verification | `backend/controllers/middlewareController.js` |
| RAG, askLLM, memory, follow-ups, optimize-query | `backend/controllers/aiContextManager.js` |
| Image list, download, compress | `backend/controllers/imagesController.js` |
| Data API routes | `backend/routes/dataRoutes.js` |
| AI API routes | `backend/routes/aiRoutes.js` |
| Images API routes | `backend/routes/imagesRoutes.js` |
| Resume PDF for AI | `backend/data/Singh_Kartavya_Resume2026.pdf` |
| Must-load / dynamic image list | dataController MUST_LOAD_IMAGES + updateDynamicImagesCache |

---

## 10. Summary

- **Frontend:** Single-page React app with hash-based sections, lazy-loaded sections, and a modal tab system (WindowModal) for details, feed, AI chat, and admin. AI chat uses optimize-query → ask-chat → follow-ups + snapshot memory; state and quota (e.g. 20 queries/day) live in App and localStorage.
- **Backend:** Fastify serving three route modules: data (CRUD + admin + GitHub + image lists), AI (RAG + memory + follow-ups + query optimization), and images (list/download/compress). Two MongoDB databases; in-memory caches for reads; hourly metrics; JWT in httpOnly cookie for admin.
- **To change:** Content per section → corresponding component under `frontend/src/components/`. API behavior → `backend/controllers/` and `backend/routes/`. AI behavior and context → `backend/controllers/aiContextManager.js`. Styling → `frontend/src/styles/*.css` and component-level classes. Environment → `.env` (backend) and `REACT_APP_*` (frontend).

This document is the **master reference** for the Kartavya portfolio codebase; use the file index and API reference to locate any feature or file quickly.
