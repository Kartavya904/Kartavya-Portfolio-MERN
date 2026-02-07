# Kartavya Portfolio – In-Depth Feature Exploration

This document catalogs **every user-facing and developer-facing feature** of the portfolio website as discovered through codebase review and browser testing. Use it as a checklist for QA or as a product/feature index.

**Live URL:** https://www.kartavya-singh.com  
**Local:** http://localhost:3000 (frontend), http://localhost:5000 (backend)

---

## 1. Loading & Entry

| Feature | Description | Where |
|--------|-------------|--------|
| **Loading gate** | App does not render until backend/DB are reachable and must-load images are requested. | `frontend/src/index.js` (Root), `frontend/src/components/SpecialComponents/Loading.js` |
| **Backend ping** | Loading screen pings API (e.g. `/api/db-ping` or `/api/ping`) to confirm backend is up. | `frontend/src/services/ping.js`, used in Loading |
| **Database ping** | Same flow confirms MongoDB is reachable. | Backend `GET /api/db-ping`, frontend ping service |
| **Must-load images preload** | Fetches list from `GET /api/must-load-images` and adds `<link rel="preload" as="image">` for each URL. | Loading.js, backend `dataController.getMustLoadImages` |
| **Battery / reduced-motion detection** | Loading can detect low battery or `prefers-reduced-motion` and set `isBatterySavingOn` to reduce animations. | Loading.js (stats), passed to App and PowerMode |
| **Greeting rotation** | Short greeting cycle (e.g. Hello, नमस्ते, Bonjour, こんにちは, مرحبا) during load. | Loading.js |
| **Enter Portfolio** | Button/link to proceed from hero; may scroll or trigger state. | HomePage hero section |

---

## 2. Navigation

| Feature | Description | Where |
|--------|-------------|--------|
| **Fixed navbar** | Top navbar stays fixed; style changes when `scrolled` (e.g. after 100px). | `frontend/src/components/SpecialComponents/NavBar.js`, `NavBar.css` |
| **Section links** | Hash links: #home, #about, #skills, #projects, #experience, #contact. Clicking smooth-scrolls with offset (e.g. 52px for navbar height). | NavBar.js `scrollToSection(id)` |
| **Active link highlighting** | On scroll, the link whose section is in view gets an `active` class. | NavBar.js scroll listener, querySelector for `.navbar-link` and section positions |
| **Section snapping** | Optional snap-to-nearest-section (within ~180px) after scroll settles (e.g. 1s debounce); skipped for #contact and #projects. | NavBar.js handleScroll, scrollToSection |
| **Mobile menu** | Hamburger “Menu” toggles `menuOpen`; menu opens/closes; click-outside and scroll close it. | NavBar.js navbar-toggler, menuRef, handleClickOutside |
| **Feed nav** | Nav item opens Feed in WindowModal (addTab("FeedTab", …)). | NavBar.js FEED link |
| **Resume link** | Nav item for resume (e.g. PDF download or external). | NavBar.js RESUME link |
| **Admin nav** | Nav item opens Admin tab in WindowModal (addTab("AdminTab", …)); requires login for full functionality. | NavBar.js, WindowModal AdminTab |
| **Brand click** | “Kartavya Singh” brand link scrolls to #home. | NavBar.js |

---

## 3. Home Section

| Feature | Description | Where |
|--------|-------------|--------|
| **Hero background** | Parallax-style background (home-bg.webp) with gradient overlay; blur/scale via Framer Motion useScroll/useTransform. | HomePage.js, HomeBGRef, motion.div with scrollYProgress |
| **Profile image** | Kartavya.webp with frame cycling on click (frame1–frame3), hover tilt (mouse position), spring boxShadow. | HomePage.js profile-picture-container, frames, handleProfileClick |
| **Name heading** | “Kartavya Singh” with zoomIn variant. | HomePage.js |
| **Typewriter subtitle** | TypeAnimation cycles through keywords; click increments key to restart animation. | HomePage.js TypeAnimation, keywords array |
| **AI chat input (hero)** | Optional input + mic for “Ask My AI Companion!”; can send query via sendQuery or open AIChatTab. | HomePage.js form, useSpeechInput, handleHomeSubmit |
| **Speech input** | useSpeechInput hook for mic-to-text; supports permission and final/interim results. | `frontend/src/hooks/useSpeechInput.js` |
| **Enter Portfolio** | CTA button to proceed (scroll or state change). | HomePage.js |
| **Project carousel / cards** | Home section shows a set of project cards with “Learn More →”; each can open ProjectTab in WindowModal. | HomePage.js, addTab("ProjectTab", projectData) |
| **Easter egg / cooldown** | Multiple profile clicks (e.g. 5) trigger cooldown (e.g. 1s); click count resets after 5s of inactivity. | HomePage.js handleClick, clickCount, isCooldown |

---

## 4. About Section

| Feature | Description | Where |
|--------|-------------|--------|
| **About heading** | “ABOUT ME” and short bio (UC, Full Stack, AI, etc.). | `frontend/src/components/AboutPage/AboutPage.js` |
| **Spotlight background** | Decorative background component. | AboutPage/SpotlightBG.js |
| **Coding / LeetCode stats** | Displays Coding Hours, Completed, LeetCode (or similar) metrics. | AboutPage.js |
| **Learn more links** | “Learn More About Me From My:” with links to Skills, Projects, Experience, etc. | AboutPage.js |

---

## 5. Skills Section

| Feature | Description | Where |
|--------|-------------|--------|
| **Skills heading** | “Skills”, “My TechStack”. | `frontend/src/components/SkillPage/SkillPage.js` |
| **Skill categories** | Categories from API (skillsCollection / skillsTable): e.g. Spoken Language, Tools & Platforms, Full Stack Development, Programming & Development, Data & AI. | SkillPage.js, fetchSkillsComponents / skillService, skillComponentService |
| **Proficiency levels** | Proficient / Intermediate / Beginner ribbons or labels. | SkillPage.js, SkillSection.js |
| **Skill icons** | Icons per skill (from assets or icon mapping). | icons.js, SkillSection |
| **Charts** | Chart.js (or similar) for skill levels or distribution. | SkillGraph.js, SkillPage.css / SkillGraph.css |
| **Carousel(s)** | Carousel(s) for skill groups (e.g. react-multi-carousel, Swiper, Glide). | SkillPage.js |
| **Background** | SkillBG component. | SkillPage/SkillBG.js |

---

## 6. Projects Section

| Feature | Description | Where |
|--------|-------------|--------|
| **Projects heading** | “My Projects”. | `frontend/src/components/ProjectPage/ProjectPage.js` |
| **Project list / grid** | ProjectsListView: list or grid of project cards. | ProjectPage.js, ProjectsListView.js |
| **Project card** | Title, tagline/description, image; “Learn More” opens ProjectTab with full project data. | ProjectPage / ProjectsListView, addTab("ProjectTab", …) |
| **Gradient background** | GradientBG component. | ProjectPage/GradientBG.js |
| **Project detail modal (ProjectTab)** | WindowModal tab: full description, images (ImageCarousel), links, tech stack, etc. | WindowModal/ProjectTab.js, ImageCarousel.js |
| **Like button** | LikeButton on project (or in ProjectTab); POST /api/addLike with type "Project" and title. | LikeButton.js, dataController.addLike |

---

## 7. Experience Section

| Feature | Description | Where |
|--------|-------------|--------|
| **Experience heading** | “My Career” (and optionally Honors, Involvement). | `frontend/src/components/ExperiencePage/ExperiencePage.js` |
| **Career tab** | CareerTabPage: list of career experiences (job title, company, dates, description). | ExperiencePage.js, CareerTabPage.js |
| **Honors tab** | HonorsTabPage: honors/awards; clicking opens HonorsTab in WindowModal. | ExperiencePage.js, HonorsTabPage.js, addTab("HonorsTab", …) |
| **Involvement tab** | InvolvementTabPage: clubs, roles; clicking opens InvolvementTab in WindowModal. | ExperiencePage.js, InvolvementTabPage.js, addTab("InvolvementTab", …) |
| **Experience detail modals** | ExperienceTab, HonorsTab, InvolvementTab: full detail, images, links. | WindowModal/ExperienceTab.js, HonorsTab.js, InvolvementTab.js |
| **Year in Review** | YearInReviewTab: annual summary; opened from experience flow or dedicated entry. | WindowModal/YearInReviewTab.js |
| **Background** | Background.js for Experience section. | ExperiencePage/Background.js |
| **Like button** | LikeButton for Experience / Honors / Involvement / YearInReview. | LikeButton.js, addLike with corresponding type |

---

## 8. Contact Section

| Feature | Description | Where |
|--------|-------------|--------|
| **Contact heading** | “Contact Me”, email, phone, and “fill the form” CTA. | `frontend/src/components/ContactPage/ContactPage.js` |
| **Contact form** | Fields: Your Name *, Your Email *, Your Phone, Your Message *. Required validation. | ContactPage.js |
| **Form submit** | Typically EmailJS or backend endpoint to send message. | ContactPage.js (e.g. @emailjs/browser or API) |
| **Static contact info** | Email (e.g. singhk6@mail.uc.edu, kartavya.singh17@yahoo.com), phone (e.g. 513-837-7683). | ContactPage.js / copy |

---

## 9. Feed (Modal Tab)

| Feature | Description | Where |
|--------|-------------|--------|
| **Feed tab** | Opened via NavBar “FEED” or programmatic addTab("FeedTab", …). | NavBar.js, WindowModal FeedTab.js |
| **Feed title** | “Kartavya's Feed”, short description. | FeedTab.js |
| **Feed list** | Items from GET /api/getFeeds; each has feedTitle, feedCategory, feedContent, feedImageURL, feedLinks, etc. | FeedTab.js, dataController.getFeeds |
| **Read more / expand** | “Read More ▼” and/or global expand to show more than 3 items. | FeedTab.js globalExpanded, currentFeeds.slice(0, 3) |
| **Pagination** | Page numbers (e.g. “1”) for paged feed. | FeedTab.js totalPages, Array.from map |
| **Like button** | LikeButton type "Feed" for each feed item. | FeedTab.js, LikeButton |
| **Feed links** | External links per feed (e.g. motion.a href). | FeedTab.js feed.feedLinks.map |
| **Feed categories** | Tags/categories per feed. | FeedTab.js feed.feedCategory.map |

---

## 10. AI Companion (Modal Tab)

| Feature | Description | Where |
|--------|-------------|--------|
| **Open AI Companion** | Floating button “Open AI Companion Tab” or “Kartavya's AI Companion” opens AIChatTab. | App.js ai-chat-container, addTab("AIChatTab", { title: "…" }) |
| **Chat UI** | Messages list (user + AI bubbles), input, send, optional “Click to talk” (speech). | WindowModal/AIChatTab.js, App.js chat state |
| **Send query** | Flow: optimize-query → ask-chat → typewriter reveal; in parallel: suggestFollowUpQuestions, snapshotMemoryUpdate. | App.js sendQuery, backend /api/ai/* |
| **Conversation memory** | Snapshot stored in state and localStorage; sent with next query. | App.js conversationMemory, snapshotMemoryUpdate |
| **Follow-up suggestions** | After each reply, up to three suggested follow-up questions. | suggestFollowUpQuestions, setFollowUpSuggestions |
| **Query quota** | MAX_QUERIES (e.g. 20) per day; persisted in localStorage; error message when exceeded. | App.js queriesSent, localStorage |
| **Stop generation** | Button or handler to set cancelRef and append “[Generation stopped]”. | App.js stopGenerating |
| **Error message** | Display of API or quota errors. | App.js errorMsg, setErrorMsg |
| **Draggable button** | AI chat FAB is draggable (Framer Motion drag). | App.js motion.div drag props |

---

## 11. Admin (Modal Tab)

| Feature | Description | Where |
|--------|-------------|--------|
| **Admin tab** | Opened via NavBar “Admin” or addTab("AdminTab", …). | NavBar.js, WindowModal AdminTab.js |
| **Login flow** | Step 1: username → compareAdminName. Step 2: password → compareAdminPassword (returns OTP). Step 3: OTP + optional rememberMe → compareOTP (sets JWT cookie). | AdminTab.js, backend compareAdminName, compareAdminPassword, compareOTP |
| **Protected actions** | With valid JWT cookie: add/edit/delete projects, experiences, feeds, skills, etc.; setAdminCredentials; check-cookie. | middlewareController.verifyJWT, dataRoutes preHandler |
| **Logout** | GET /api/logout clears token cookie. | dataController.logoutAdmin, AdminTab |
| **Admin console** | UI for CRUD on projects, experiences, involvements, honors, year-in-review, skills, feeds. | AdminConsole.js, AdminTab.js |
| **Collection counts** | GET /api/collection-counts for dashboard. | dataController.getCollectionCounts |

---

## 12. WindowModal (Shared)

| Feature | Description | Where |
|--------|-------------|--------|
| **Tab bar** | Up to 3 tabs; each tab has name and type (ProjectTab, ExperienceTab, FeedTab, AIChatTab, AdminTab, etc.). | WindowModal.js tabs state, lastActiveIndex |
| **Tab content** | Rendered by type: ProjectTab, ExperienceTab, InvolvementTab, HonorsTab, YearInReviewTab, FeedTab, AIChatTab, AdminTab. | WindowModal.js switch/render by tabs[lastActiveIndex].type |
| **Minimize** | “—” minimizes modal (toast “Minimized … Tab”); clears AI state when minimizing. | WindowModal.js handleMinimize |
| **Close** | “✕” closes modal (setIsClosed(true)? or remove tab). | WindowModal.js |
| **Restore** | After minimize, restore brings modal back. | WindowModal.js handleRestore |
| **Click outside** | Clicking outside modal (with exceptions for feed-nav, ai-chat-nav, navbar-toggler) minimizes and clears AI state. | WindowModal.js handleClickOutside |
| **Body scroll lock** | When modal is open and not minimized, body scroll is locked (e.g. overflow hidden). | WindowModal.js, CSS |
| **isWindowModalVisible** | Passed to App/sections to hide floating AI button when modal is visible. | App.js, WindowModal useEffect |

---

## 13. Links & Footer

| Feature | Description | Where |
|--------|-------------|--------|
| **Floating Links** | Links component: social or external links (e.g. GitHub, LinkedIn); hidden or styled when isWindowModalVisible. | `frontend/src/components/SpecialComponents/Links.js` |
| **Footer** | Footer with “Kartavya Singh”, “Creating Impactful Solutions Through Code”, links (About, Skills, Projects, Experience, Admin), copyright. | `frontend/src/components/SpecialComponents/Footer.js` |

---

## 14. Power Mode & Accessibility

| Feature | Description | Where |
|--------|-------------|--------|
| **Battery saver** | When isBatterySavingOn, many Framer Motion variants are no-ops (no scale/opacity animation). | PowerMode.js, passed to App and sections |
| **Reduced motion** | Loading can set battery saver based on prefers-reduced-motion. | Loading.js |
| **Touch device** | Loading stats include isTouchDevice; can affect behavior. | Loading.js |

---

## 15. Backend API (Feature Surface)

| Area | Features | Where |
|------|----------|--------|
| **Health** | GET /, GET /api, GET /api/ping, GET /api/db-ping | server.js, dataRoutes.js |
| **Portfolio CRUD** | getprojects, getprojects/:link, add/update/delete project (same for involvements, experiences, yearInReviews, honorsExperiences, skills, skillComponents, FeedTable) | dataRoutes.js, dataController.js |
| **Auth** | compareAdminName, compareAdminPassword, compareOTP, logoutAdmin, setAdminCredentials, check-cookie (JWT) | dataRoutes.js, dataController.js, middlewareController.js |
| **Images** | must-load-images, dynamic-images; get_all_images, download_all_images, compress_* | dataController.js, imagesRoutes.js, imagesController.js |
| **GitHub** | github-stats/top-langs (JSON), /top-langs (SVG proxy) | dataRoutes.js, dataController.js |
| **Likes** | addLike (type + title) | dataController.addLike |
| **Collection counts** | collection-counts | dataController.getCollectionCounts |
| **AI** | create-index, ask-chat, suggestFollowUpQuestions, snapshotMemoryUpdate, optimize-query | aiRoutes.js, aiContextManager.js |

---

## 16. Data & State

| Feature | Description | Where |
|--------|-------------|--------|
| **Primary MongoDB** | projectTable, experienceTable, involvementTable, honorsExperienceTable, yearInReviewTable, skillsCollection, skillsTable, FeedTable, KartavyaPortfolio, KartavyaPortfolioOTP | backend config/mongodb.js, dataController |
| **AI MongoDB** | contextMeta, dbContexts, githubContexts, resumeContexts, memoryIndex | aiContextManager.js |
| **Caching** | In-memory TTL cache for collection lists; must-load/dynamic images cache; collection counts cache; GitHub top-langs cache (scheduled). | dataController.js |
| **Client persistence** | conversationMemory, queriesSent, hideAIChatTip in localStorage. | App.js |

This completes the in-depth feature exploration. For technical implementation details and file paths, see `Miscellaneous/Website-Summary.md`. For issues and bottlenecks, see `Miscellaneous/Website-Bottlenecks-And-Issues.md`.
