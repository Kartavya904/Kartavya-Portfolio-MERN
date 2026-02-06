# Kartavya Portfolio – Performance & Slowness Analysis

This document explains **why the site feels slow to load (LCP in the red, ~5s) and why scrolling feels jittery** on different devices. Each cause is tied to specific code, and fixes are suggested **without removing or redesigning features** where possible.

**Scope:** Frontend load performance (LCP, FCP, TTI) and runtime performance (scroll jank, main-thread blocking).

---

## Executive summary

| Issue | What you see | Main causes |
|-------|----------------|-------------|
| **LCP ~5s (red)** | First “real” content (hero) appears very late; Lighthouse LCP is poor. | Loading gate (DB + greetings + must-load) delays first paint of App; hero image and fonts load after that; render-blocking CSS. |
| **Jittery / slow scroll** | Scrolling feels laggy, like the “slowest machine”; not smooth. | Many scroll listeners doing DOM reads/writes every frame; Framer Motion scroll-linked blur/scale; `background-attachment: fixed`; React state updates on scroll; canvas animations. |

Below: **what exactly is happening**, **where in the code**, **why it slows things down**, and **what to do about it** (keeping behavior the same where possible).

---

# Part A: Why initial load is slow (LCP ~5 seconds)

LCP (Largest Contentful Paint) is the time until the largest visible content (usually the hero image or main block) is painted. Target: **≤ 2.5s** (good), **≤ 4s** (needs improvement), **> 4s** (poor). Yours is ~5s, so it’s in the red.

---

## A.1 Loading gate delays first content

**What’s happening**  
The app does **not** render the main UI until:

1. Backend/DB ping completes (`pingDatabase()`).
2. **All five greetings** have been shown (Hello → नमस्ते → Bonjour → こんにちは → مرحبا) at **400ms each** → ~2 seconds minimum.
3. Must-load images API is called and **preload `<link>` tags are added** (images are not actually awaited, but the gate waits for this request + state update).

Only then does `onComplete()` run → `setIsReady(true)` → `App` (and thus the hero) mounts. So **LCP cannot happen before** DB + ~2s greetings + must-load fetch. The “largest contentful” element (hero background or profile image) only starts loading **after** the loading screen disappears.

**Where**  
- `frontend/src/index.js`: `Root` renders `Loading` until `isReady`.  
- `frontend/src/components/SpecialComponents/Loading.js`:  
  - Greetings interval: 400ms × 5 (lines 29–39).  
  - `checkStatus` → `pingDatabase` → then `preloadMustLoadImages()` (lines 42–95).  
  - `onComplete()` only when `loaded && allGreetingsShown && imagesReady` (lines 158–163).

**Why it hurts**  
LCP is measured from navigation start. Every extra second before the hero can paint (DB latency, 2s greetings, must-load round-trip) adds directly to LCP. So even with a fast network, you’re giving away 2+ seconds.

**Solutions (without changing the “feature” of having a loading screen)**  
1. **Shorten or skip the greeting sequence**  
   - Show 1–2 greetings only, or show them in parallel (e.g. one line cycling) so “all shown” is reached in ~400–800ms instead of 2s.  
   - Or make `allGreetingsShown` true after the first greeting (so the loading screen still exists, but it doesn’t force 2s).  
2. **Don’t block on must-load preload**  
   - Call `/api/must-load-images` and add preload links in the background, but set `imagesReady(true)` as soon as DB is up (or after a short timeout). Hero will then paint earlier; preload still helps images load faster once the hero is in the DOM.  
3. **Optional: don’t block on DB for first paint**  
   - Show the app (and hero) immediately; show a small “Connecting…” or retry if API calls fail. This improves LCP the most but changes UX; only if you’re okay with that.

---

## A.2 Must-load images: preload ≠ “loaded”

**What’s happening**  
`Loading.js` fetches `/api/must-load-images`, then for each URL it does:

```js
const link = document.createElement("link");
link.rel = "preload";
link.as = "image";
link.href = url;
document.head.appendChild(link);
```

Then it sets `setImagesReady(true)`. So “images ready” only means “we added preload links.” The browser may not have finished loading those images. When the app then mounts, the hero uses:

- `url('…/home-bg.webp')` (CSS background on `.homepage-bg`)
- `<img src="…/Kartavya.webp" />` (profile photo)

If those assets aren’t fully loaded yet, LCP is the moment they **finish** painting. That can be several seconds after the loading screen disappears, especially on slow networks or devices.

**Where**  
- `Loading.js` (lines 52–82): `preloadMustLoadImages`, `setImagesReady(true)` after adding links.  
- Backend `dataController.js`: `MUST_LOAD_IMAGES` includes `/home-bg.webp`, `/Kartavya.webp`, `/Kartavya-Profile-Photo.webp`, `/contact-bg.webp`, `/system-user.webp`, `/user-icon.svg`.  
- Hero: `HomePage.js` (background image and profile `<img>`).

**Why it hurts**  
LCP is typically the hero image or the largest text block. If the hero image is still loading when the main content appears, LCP is delayed until that image (or the next largest element) is painted.

**Solutions (without removing preload)**  
1. **Prioritize LCP assets**  
   - In `index.html`, add a single `<link rel="preload" as="image" href="/home-bg.webp">` (and optionally `Kartavya.webp`) so the browser starts loading them before any React/API.  
2. **Reduce must-load list**  
   - Remove from `MUST_LOAD_IMAGES` anything not above-the-fold on first paint (e.g. `system-user.webp`, `user-icon.svg`, `contact-bg.webp` if contact is below). Fewer preloads = less contention; LCP assets get more bandwidth.  
3. **Don’t gate on “images ready”**  
   - As in A.1: set `imagesReady(true)` when DB (or a timeout) is done; let preload run in parallel. First paint happens earlier; images may still load in quickly thanks to preload.

---

## A.3 Render-blocking CSS and fonts

**What’s happening**  
- **index.html** loads **three** Font Awesome stylesheets (4.7, 5.15.4, 6.0) from CDN. Each is render-blocking: the browser must fetch and parse them before it can finish first paint.  
- **index.css** (or the CSS entry that’s loaded first) has `@import url("https://fonts.googleapis.com/css2?family=Montserrat...")`. `@import` is blocking: nothing after it can be used until the Google Font CSS is loaded.  
- You also declare **local** Montserrat via `@font-face` in both `index.css` and `App.css`. So you’re loading Montserrat from Google **and** from local TTF. Double work and possible FOUT/FOIT.

**Where**  
- `frontend/public/index.html`:  
  - `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />`  
  - `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />`  
  - `<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />`  
- `frontend/src/index.css`: `@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap");` plus `@font-face` for local Montserrat.  
- `frontend/src/App.css`: same `@font-face` again.

**Why it hurts**  
Blocking CSS delays First Contentful Paint and can delay when the main layout (and thus LCP) is ready. Multiple large external stylesheets add latency. Fonts not optimized can also delay text (and sometimes LCP if the largest element is text).

**Solutions (without changing visual design)**  
1. **Use one Font Awesome version**  
   - Pick one (e.g. 6.x) and remove the other two `<link>`s. If some icons are from 4.7 or 5.x, replace them with the 6.x equivalents.  
2. **Load Font Awesome async**  
   - Keep one FA link but load it asynchronously:  
     `<link rel="stylesheet" href="..." media="print" onload="this.media='all'">`  
   - Or load it from JS after first paint. Icons may briefly not use FA (fallback font); behavior is the same once loaded.  
3. **Use only local Montserrat**  
   - Remove the Google `@import` from `index.css`. Use only your `@font-face` (Montserrat-Regular, Medium, Bold). Eliminates a round-trip and avoids double font loading.  
4. **Deduplicate @font-face**  
   - Define Montserrat `@font-face` in one place only (e.g. `index.css` or a single `fonts.css`), not in both `index.css` and `App.css`.

---

## A.4 Hero image and LCP element

**What’s happening**  
The likely LCP element is either:

- The **hero background** `home-bg.webp` (large, full-viewport), or  
- The **profile image** `Kartavya.webp` (250×250, prominent).

Both are in `MUST_LOAD_IMAGES` and used in `HomePage.js`. The background is applied via inline style `background: ... url('…/home-bg.webp')`. The profile is `<img src={...} />`. Neither has explicit `fetchpriority="high"` or `loading="eager"` on the img (for the profile, adding `loading="eager"` is valid since it’s above the fold).

**Where**  
- `HomePage.js`:  
  - `motion.div` with `background: ... url('${process.env.PUBLIC_URL}/home-bg.webp')` (lines 169–211).  
  - `<animated.img src={`${process.env.PUBLIC_URL}/Kartavya.webp`} ... />` (lines 237–255).  
- No `fetchpriority` or preload in HTML for these two.

**Why it hurts**  
If the browser doesn’t prioritize these URLs, they compete with other preloads and scripts. The moment the largest of them finishes painting is your LCP; any delay in starting or finishing their load increases LCP.

**Solutions (without changing layout)**  
1. **Preload the LCP image in HTML**  
   - In `public/index.html`:  
     `<link rel="preload" as="image" href="%PUBLIC_URL%/home-bg.webp">`  
   - If you find (e.g. via Lighthouse) that LCP is the profile image, add a preload for `Kartavya.webp` instead or in addition.  
2. **Mark the profile img as high priority**  
   - On the profile `<img>`, add `fetchPriority="high"` and `loading="eager"`.  
3. **Ensure hero background URL is correct**  
   - Confirm `process.env.PUBLIC_URL` in production is what you expect (e.g. "" or your base path) so the URL is valid and the image loads immediately.

---

## A.5 CPU test on the main thread during load

**What’s happening**  
In `Loading.js`, `checkPerformanceAndCapabilities` runs a tight loop to estimate CPU speed:

```js
const testCpuPerformance = () => {
  const start = performance.now();
  for (let i = 0; i < 1e7; i++) Math.sqrt(i);
  return performance.now() - start;
};
const cpuTestDuration = testCpuPerformance();
```

This runs on the main thread during the loading screen. On slow devices it can take tens of milliseconds or more, blocking layout, paint, and JS that would help the app become ready.

**Where**  
- `Loading.js` (lines 111–117).

**Why it hurts**  
Main-thread blocking during load delays when the rest of your loading logic (and eventually the app) can run. It also delays any preload/progress the browser could be making.

**Solutions (without removing the “battery/performance” feature)**  
1. **Run the CPU test after first paint**  
   - Don’t call `testCpuPerformance()` before `onComplete()`. Set `isBatterySavingOn` from other signals (e.g. `navigator.hardwareConcurrency`, `deviceMemory`, `prefers-reduced-motion`) first; run the CPU test in a `requestIdleCallback` or `setTimeout` after the app has mounted.  
2. **Shorten the loop**  
   - Use e.g. `1e6` instead of `1e7` so the test is faster and blocks less.  
3. **Move to a Web Worker**  
   - Run the loop in a worker and post the result back. Main thread stays free during load.

---

## A.6 All sections mount at once (no route-based splitting)

**What’s happening**  
`App.js` renders HomePage, AboutPage, SkillPage, ProjectPage, ExperiencePage, ContactPage, Links, WindowModal all in one tree. They’re lazy-loaded via `React.lazy` and `Suspense`, but as soon as the user sees the first screen, the rest of the chunks are still loaded (and all sections eventually mount). So:

- A lot of components mount and run `useEffect` (data fetches, scroll listeners, canvas loops).  
- The main bundle (or initial chunks) still includes Framer Motion, React Spring, Chart.js, carousels, etc., because they’re used by components that are in the initial tree.

**Where**  
- `App.js`: all page components are children of the same `App`; no router that would unmount sections when not visible.

**Why it hurts**  
- More JS to parse/execute on load → slower TTI and a busier main thread when the user starts scrolling.  
- More DOM and more `useEffect` (scroll, resize, canvas) → more work during scroll and resize.

**Solutions (without changing “single-page” behavior)**  
1. **Keep lazy loading**  
   - You already use `lazy()`; ensure heavy libs (e.g. Chart.js, react-syntax-highlighter) are only imported inside lazy components so they’re in separate chunks.  
2. **Defer below-the-fold sections**  
   - Use Intersection Observer: mount AboutPage / SkillPage / ProjectPage / ExperiencePage only when the user scrolls near them (or when the previous section is in view). Until then, render a placeholder (e.g. same height, no content). This reduces initial DOM and effect setup.  
3. **Don’t block LCP on non-hero chunks**  
   - Ensure the hero (HomePage) and the minimal shell (NavBar, etc.) are in the first chunk; other pages can load after.

---

# Part B: Why scrolling feels jittery and slow

Scroll jank usually comes from: (1) too much work on the main thread on every scroll (or every frame), (2) layout thrashing (alternating DOM reads and writes), (3) expensive visual effects (blur, `background-attachment: fixed`), (4) many React re-renders on scroll.

---

## B.1 Multiple scroll listeners and DOM work every frame

**What’s happening**  
Several components attach `window` scroll listeners:

| Component | What it does on scroll |
|-----------|------------------------|
| **App.js** | `setScrolled(window.scrollY > 100)` → re-renders App and all children that use `scrolled`. |
| **NavBar.js** | (1) `handleScroll`: `querySelectorAll("section")`, `querySelectorAll("nav .navbar-menu .navbar-links .navbar-link")`, then for each section does offset math and toggles `.active` on links; (2) schedules a **1s** `setTimeout` to run “snap to nearest section” (which does more querySelectorAll + scrollTo). (3) Another listener: `setScrolled(window.scrollY > 100)`. |
| **ProjectsListView.js** | `handleScroll`: `querySelector(".project-section-title")`, `getComputedStyle(header)`, `querySelector(".project-card-last")`, `getBoundingClientRect()`, then sets `header.style.position` and `header.style.top`. |
| **Links.js** | When menu is open, `handleScroll` calls `setIsOpen(false)`. |

So on **every** scroll event (often 60+ per second while the user scrolls):

- **App**: one `setState` → full App re-render (PowerMode, NavBar, HomePage, About, Skills, Projects, Experience, Contact, Links, WindowModal all get new props).  
- **NavBar**: two DOM queries (all sections, all nav links), multiple getBoundingClientRect/offsetTop, classList changes, and a new 1s timeout (previous timeouts are cleared, but still work).  
- **ProjectsListView**: getComputedStyle, getBoundingClientRect, and **style writes** (position, top). That’s a classic **read–read–write** pattern in the same frame → **layout thrashing**: the browser may recalculate layout after each write, then the next read forces another layout.

**Where**  
- `App.js` (lines 352–359): `onScroll` → `setScrolled`.  
- `NavBar.js` (lines 58–131): `handleScroll` (sections + links + 1000ms timeout); (lines 134–156): `onScroll` → `setScrolled`.  
- `ProjectsListView.js` (lines 56–79): `handleScroll` (header + lastCard + style).  
- `Links.js` (lines 54–56, 67): `handleScroll` → `setIsOpen(false)`.

**Why it hurts**  
- **Layout thrashing**: In ProjectsListView, reading layout (getComputedStyle, getBoundingClientRect) and then writing (header.style) in the same handler forces repeated reflows.  
- **Too much work per frame**: Multiple querySelectorAll, loops, and setState in one scroll tick can push frame time over 16ms → dropped frames and jank.  
- **React re-renders**: `setScrolled` in App and NavBar causes large subtrees to re-render on every scroll; if those trees aren’t memoized, that’s a lot of diffing and potential DOM updates.

**Solutions (without changing behavior)**  
1. **Throttle or use passive scroll**  
   - Use a throttle (e.g. 100–150ms) or `requestAnimationFrame` so you don’t run the full logic more than once per frame.  
   - Add `{ passive: true }` to `addEventListener("scroll", handler, { passive: true })` so the browser can scroll without waiting for your handler.  
2. **Debounce heavy work in NavBar**  
   - In `handleScroll`, only update active link (and classList) on a short debounce or rAF; run the “snap to section” logic on scroll-end (e.g. 150ms after last scroll), not on a 1000ms timeout on every scroll.  
3. **Avoid layout thrashing in ProjectsListView**  
   - In `handleScroll`, don’t mix reads and writes in the same frame. Option A: read all needed values (getBoundingClientRect, getComputedStyle) once, then in a `requestAnimationFrame` (or the next frame) do the style writes. Option B: cache header/lastCard refs and only read/write when scroll has stopped (debounce).  
4. **Reduce re-renders from `scrolled`**  
   - Use a ref for “scrolled” for purely visual updates (e.g. navbar style) and update a class on the navbar DOM node from a throttled listener, so you don’t need to `setState` in App. If you keep state, wrap children in `React.memo` and pass only the minimal props that depend on scroll (e.g. `scrolled` only to NavBar and PowerMode), so other sections don’t re-render.

---

## B.2 Framer Motion scroll-linked blur and scale (HomePage)

**What’s happening**  
In `HomePage.js`:

```js
const { scrollYProgress } = useScroll({
  target: HomeBGRef,
  offset: ["start start", "end start"],
  axis: "y",
  smooth: true,
});
const blur = useTransform(scrollYProgress, [0, 1], [1, 20]);
const scale = useTransform(scrollYProgress, [0, 0.1, 1], [1.01, 1.01, 1.6]);
```

These values drive the hero background’s style:

- `filter: blur(${appliedBlur}px)`  
- `scale` (and `transformOrigin`, `willChange: "transform, filter"`)

So on **every** scroll (and every frame Framer Motion updates), the browser must:

- Recompute the transform and **blur** for a full-viewport layer.  
- Composite that layer.  
`filter: blur()` is one of the most expensive CSS effects, especially on a large area. `smooth: true` may also add interpolation that runs every frame.

**Where**  
- `HomePage.js` (lines 26–38, 167–211): `useScroll`, `useTransform`, and the `motion.div` with `style={{ ... scale, filter: blur(...) }}`.

**Why it hurts**  
- Blur and scale on a big element cause heavy paint/composite work every frame.  
- Combined with other scroll listeners and state updates, the main thread can’t keep up with 60fps.

**Solutions (without removing the effect)**  
1. **Disable or reduce blur when not needed**  
   - You already gate with `scrolled && currentBlur > 0.3`. Consider applying blur only when scrollYProgress is above a higher threshold (e.g. 0.5) so the effect runs less often.  
2. **Use a lower max blur**  
   - Change the blur range from `[1, 20]` to e.g. `[1, 8]` or `[1, 12]`. Less blur = less GPU work.  
3. **Respect reduced motion**  
   - If `prefers-reduced-motion: reduce` or your battery-saving mode is on, don’t apply scroll-linked blur/scale at all (only static background).  
4. **Layer and will-change**  
   - You already use `willChange: "transform, filter"` and `transform: "translateZ(0)"`; that’s good. Ensure the hero background is its own layer (e.g. no other heavy content in the same stacking context) so repaints are contained.

---

## B.3 background-attachment: fixed on the hero

**What’s happening**  
The hero background uses `backgroundAttachment: "fixed"` (and `background-size: cover`, etc.). So the background is fixed to the viewport while the content scrolls. Browsers implement this by repainting the fixed background in response to scroll or resize, which is expensive.

**Where**  
- `HomePage.js` (lines 184, 201): `backgroundAttachment: "fixed"` in the style object for `.homepage-bg`.  
- `HomePage.css` (line 130): `background-attachment: fixed` in `.homepage-bg`.

**Why it hurts**  
`background-attachment: fixed` is known to cause performance issues and jank on scroll, especially on mobile and low-end devices.

**Solutions (without changing the “parallax-like” look)**  
1. **Use a fixed-position div with the image**  
   - Instead of CSS `background-attachment: fixed`, use a `position: fixed` (or absolute) div that contains an `<img>` or a div with background, and let the content scroll over it. You can still apply the same blur/scale via Framer Motion on that layer. Often performs better than `background-attachment: fixed`.  
2. **Disable fixed in battery-saving or reduced-motion**  
   - When `isBatterySavingOn` or reduced-motion is true, use `background-attachment: scroll` so the background scrolls with the page; no fixed repaint.  
3. **Remove fixed on small screens**  
   - Use a media query or JS to set `background-attachment: scroll` for viewports below a certain width or for touch devices, to reduce jank on the devices that suffer most.

---

## B.4 React state updates on scroll (scrolled)

**What’s happening**  
Both **App** and **NavBar** maintain a “scrolled” state (whether `window.scrollY > 100`) and update it in a scroll listener. So every time the user scrolls past 100px (and on every subsequent scroll event), both can call `setState`. That triggers re-renders of:

- App → PowerMode, NavBar, HomePage (receives `scrolled`), AboutPage, SkillPage, ProjectPage, ExperiencePage, ContactPage, Links, WindowModal.  
- NavBar → its own UI (class names, etc.).

So the entire app tree can re-render frequently during scroll, even though only the navbar (and maybe PowerMode / hero blur) actually need to react to `scrolled`.

**Where**  
- `App.js`: `scrolled` state, `setScrolled` in scroll listener (lines 30, 353–358).  
- `NavBar.js`: local `scrolled` state, `setScrolled` in scroll listener (lines 9, 138–156).  
- `HomePage.js`: uses `scrolled` prop for blur (lines 35–36, 206).

**Why it hurts**  
Unnecessary re-renders keep the main thread busy (React reconciliation, possible DOM updates) and contribute to scroll jank.

**Solutions (without changing what the navbar or hero look like)**  
1. **Single source of truth**  
   - Keep `scrolled` only in App (or only in NavBar) and pass it down or derive navbar class from it; remove the duplicate scroll listener that only sets “scrolled.”  
2. **Throttle the setState**  
   - Update `scrolled` at most every 100–150ms or once per `requestAnimationFrame`, not on every scroll event.  
3. **Use a ref for visual-only updates**  
   - If the only use of `scrolled` is navbar class and hero blur, you can keep a ref updated in a passive, throttled scroll listener and apply a class to the navbar (e.g. `document.getElementById('mainNav').classList.toggle('scrolled', scrollY > 100)`), and for the hero blur use the same ref in a rAF so Framer Motion doesn’t need a React state. Then you avoid app-wide re-renders.  
4. **Memoize children**  
   - Wrap page components in `React.memo` so they don’t re-render when only `scrolled` (or other unrelated props) change. Pass `scrolled` only to components that need it (NavBar, PowerMode, HomePage).

---

## B.5 ProjectsListView: sticky header and layout reads/writes

**What’s happening**  
On every scroll, `handleScroll` in ProjectsListView:

1. Reads `document.querySelector(".project-section-title")` and `window.getComputedStyle(header)`.  
2. Reads `document.querySelector(".project-card-last")` and `lastCard.getBoundingClientRect()`.  
3. Writes `header.style.position` and `header.style.top`.

Doing read–read–write in the same handler causes the browser to recalculate layout after the write; the next scroll event may read again and force another layout. This is layout thrashing. Additionally, the same component has a large `useEffect` that runs when `projects`, `isBatterySavingOn`, `layoutTrigger`, or `lastCardMargin` change, and that effect does many getComputedStyle and getBoundingClientRect calls and then sets `containerEl.style.paddingBottom`, `titleEl.style.top`, etc.

**Where**  
- `ProjectsListView.js` (lines 56–79): scroll handler; (lines 81–146): layout effect with multiple DOM reads and style writes.

**Why it hurts**  
Layout thrashing on scroll directly causes jank. The effect’s reads/writes are less frequent but can still cause reflows when they run.

**Solutions (without changing the sticky behavior)**  
1. **Batch reads and writes**  
   - In the scroll handler: in one block read all needed values (getBoundingClientRect, getComputedStyle). In the next `requestAnimationFrame` (or a separate function called in rAF), do all style writes.  
2. **Debounce the scroll handler**  
   - Run the sticky logic only when scroll has stopped (e.g. 100ms debounce). The header might switch between sticky/relative a bit later, but scroll will be smoother.  
3. **Use CSS only if possible**  
   - If the sticky behavior can be achieved with `position: sticky` and one or two known offsets (e.g. `top: 52px`) and a single media query, avoid JS for toggling position on scroll.  
4. **Cache refs**  
   - Store references to `.project-section-title` and `.project-card-last` (e.g. refs or from the parent ref) so you don’t call querySelector on every scroll.

---

## B.6 NavBar: 1s timeout on every scroll and heavy DOM queries

**What’s happening**  
In NavBar’s `handleScroll`:

- It runs `querySelectorAll("section")` and `querySelectorAll("nav .navbar-menu .navbar-links .navbar-link")` on every scroll.  
- It updates the active link by looping sections and toggling classes.  
- It sets a **1000ms** `setTimeout` to “snap to nearest section.” Each new scroll clears the previous timeout and sets a new one. So while the user is scrolling, a new timeout is created on every event; when scrolling stops, one timeout fires and runs more querySelectorAll and `scrollToSection(id)`.

**Where**  
- `NavBar.js` (lines 58–131): `handleScroll` with sections/links and 1000ms timeout.

**Why it hurts**  
- querySelectorAll and loops on every scroll add up.  
- Many timeouts (even if cleared) add overhead.  
- The snap logic can trigger a `scrollTo`, which then triggers more scroll events and handlers.

**Solutions (without removing snap or active link)**  
1. **Throttle handleScroll**  
   - Run the “active link” and “snap” logic at most every 100–150ms or once per rAF.  
2. **Use one timeout for snap**  
   - You already clear the previous timeout; that’s good. Consider increasing the delay to 150–200ms after last scroll before running snap, so it only runs when the user has clearly stopped.  
3. **Cache section and link elements**  
   - On mount or when the DOM for sections/nav is ready, query sections and nav links once and store in refs; in the scroll handler only read offsetTop/offsetHeight and update classes, no querySelectorAll.  
4. **Passive listener**  
   - Add `{ passive: true }` to the scroll listener so the browser doesn’t wait for your handler to finish before scrolling.

---

## B.7 Canvas animations (SpotlightBG, Experience Background, SkillBG, GradientBG)

**What’s happening**  
AboutPage uses `SpotlightBG` (canvas with hexagons and mouse/breathing animation). Experience and Skill and Project pages use similar canvas-based backgrounds. Each typically runs a `requestAnimationFrame` loop. Because all sections are mounted at once (see A.6), these loops can all be running even when the user is only viewing the hero. Each frame they do:

- getBoundingClientRect (for canvas size or mouse)
- Clear and redraw canvas

**Where**  
- `AboutPage.js`: `<SpotlightBG />`.  
- Experience and Skill and Project pages: similar canvas components (Background.js, SkillBG.js, GradientBG.js).

**Why it hurts**  
Multiple rAF loops and canvas draws consume main-thread time. During scroll, the browser is already busy with layout and paint; extra canvas work increases the chance of dropped frames.

**Solutions (without removing the visuals)**  
1. **Pause when not in view**  
   - Use Intersection Observer: when the section is not in view (e.g. less than 10% visible), stop the rAF loop and resume when it comes back into view.  
2. **Reduce frame rate when in view**  
   - Run the canvas update every 2nd or 3rd frame (e.g. use a counter and only draw when `counter % 2 === 0`) so you cut CPU use in half or more while keeping the animation.  
3. **Simplify when battery-saving or reduced-motion**  
   - In battery-saving or reduced-motion mode, don’t run the canvas at all (or show a static gradient/image instead).

---

## B.8 Resize listeners and style.zoom

**What’s happening**  
Several components add `window.addEventListener("resize", ...)` and inside the handler they:

- Call `document.querySelector(...)` (e.g. `.home-row`, `.info`, `.project-container`, `.links-content`, `.loading-content`, `.about-content`).  
- Set `element.style.zoom = ...` based on window size.

So on every resize you have DOM queries and style writes. Resize is less frequent than scroll, but it still can cause layout and reflow. Also, `zoom` is a non-standard property that can trigger reflow.

**Where**  
- Loading.js (lines 166–181), HomePage.js (lines 142–161), Links.js (lines 79–94), ProjectsListView.js (lines 215–234), AboutPage.js (lines 29–44), and possibly others.

**Why it hurts**  
Multiple resize listeners and direct style.zoom updates can cause reflows. If any of these run during scroll (e.g. mobile address bar causing resize), they add to jank.

**Solutions (without changing the responsive zoom behavior)**  
1. **Debounce resize**  
   - Run the zoom update only after resize has stopped (e.g. 150ms debounce).  
2. **Cache elements**  
   - Use refs for the elements you need (e.g. homeRowRef, infoRowRef) instead of querySelector on every resize.  
3. **Prefer CSS where possible**  
   - If the goal is to scale content on small screens, consider `transform: scale()` with a container or media queries instead of `zoom`, and only use JS when necessary.

---

# Summary: what is slowing the website down

## LCP (initial load, ~5s)

| Cause | Where | Fix (short) |
|-------|--------|-------------|
| Loading gate: DB + 2s greetings + must-load | Loading.js, index.js | Shorten greetings; don’t block on must-load; optional: don’t block on DB |
| Must-load “ready” ≠ images actually loaded | Loading.js, dataController | Preload LCP in HTML; reduce must-load list; don’t gate on imagesReady |
| Three Font Awesome + Google Font @import | index.html, index.css | One FA; async or defer FA; use only local Montserrat; dedupe @font-face |
| Hero image not prioritized | HomePage.js, index.html | Preload home-bg (and/or Kartavya) in HTML; fetchPriority + loading="eager" on img |
| CPU test on main thread | Loading.js | Run after load or in worker; or shorten loop |
| All sections mount at once | App.js | Defer below-fold sections with Intersection Observer; keep hero in first chunk |

## Scroll jank

| Cause | Where | Fix (short) |
|-------|--------|-------------|
| Many scroll listeners + setState + DOM work | App, NavBar, ProjectsListView, Links | Throttle/rAF; passive; debounce; single scrolled source; memoize |
| Layout thrashing (read then write) | ProjectsListView handleScroll | Batch reads then writes in rAF; or debounce; cache refs |
| Framer Motion scroll blur/scale | HomePage.js | Lower blur max; apply only above scroll threshold; respect reduced-motion |
| background-attachment: fixed | HomePage.js, HomePage.css | Fixed-position div instead; or disable for battery/reduced-motion/small screens |
| NavBar: querySelectorAll + 1s timeout every scroll | NavBar.js | Throttle; cache section/link refs; passive listener |
| Canvas rAF loops always running | SpotlightBG, Background, SkillBG, GradientBG | Pause when not in view; reduce FPS; disable in battery-saving |
| Resize listeners + style.zoom | Loading, HomePage, Links, ProjectsListView, About | Debounce; refs; prefer CSS |

---

# Recommended order of work

1. **Quick wins (no UX change)**  
   - Throttle/passive scroll listeners (App, NavBar, ProjectsListView, Links).  
   - Batch reads/writes in ProjectsListView scroll handler (or debounce).  
   - Reduce NavBar’s scroll work (cache refs, throttle, one timeout with 150–200ms delay).  
   - One Font Awesome version; remove Google Font @import if using local Montserrat; dedupe @font-face.

2. **LCP**  
   - Shorten or relax loading gate (greetings, don’t block on imagesReady).  
   - Preload LCP image in index.html; add fetchPriority/loading="eager" on profile img.  
   - Move CPU test after load or to worker.

3. **Heavy effects**  
   - Reduce or gate hero blur/scale (threshold, reduced-motion).  
   - Replace or conditionally disable `background-attachment: fixed`.  
   - Pause or throttle canvas when not in view.

4. **Larger refactors**  
   - Defer below-fold sections with Intersection Observer.  
   - Single “scrolled” source and fewer re-renders (ref + class or memo).

---

**References**  
- [LCP – web.dev](https://web.dev/lcp/)  
- [Optimize LCP – web.dev](https://web.dev/optimize-lcp/)  
- [Rendering performance – web.dev](https://web.dev/rendering-performance/)  
- [Avoid large, complex layouts and layout thrashing – web.dev](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/)  
- [background-attachment: fixed and performance](https://developer.mozilla.org/en-US/docs/Web/CSS/background-attachment#values)

For existing bottlenecks and issues (console, UX, security), see `Miscellaneous/Website-Bottlenecks-And-Issues.md`.
