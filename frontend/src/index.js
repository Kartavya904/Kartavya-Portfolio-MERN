import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import "./index.css";
import Loading from "./components/SpecialComponents/Loading";

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("App error:", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ padding: 24, textAlign: "center", fontFamily: "sans-serif" }}
        >
          <h1>Something went wrong</h1>
          <p>Try refreshing the page.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log(
  "%cHey there, developer. I see you. 👀",
  "font-weight: bold; font-size: 14px;",
);
console.log(
  "No errors here (hopefully)—but I knew you'd come over here to spectate on the elements.",
);
console.log("Good luck! — A CS student who left this here for you. 🛠️");

const SECTION_IDS = [
  "home",
  "about",
  "skills",
  "projects",
  "experience",
  "contact",
];
const URL_TO_SECTION = {
  skill: "skills",
  skills: "skills",
  project: "projects",
  projects: "projects",
  experience: "experience",
  experiences: "experience",
};
const MODAL_SEGMENTS = {
  feed: { type: "FeedTab", data: { title: "Kartavya's Feed" } },
  feeds: { type: "FeedTab", data: { title: "Kartavya's Feed" } },
  admin: { type: "Admin", data: { adminTitle: "Admin Page" } },
  dashboard: { type: "Admin", data: { adminTitle: "Admin Page" } },
  ai: { type: "AIChatTab", data: { title: "Kartavya's AI Companion" } },
  aichat: { type: "AIChatTab", data: { title: "Kartavya's AI Companion" } },
  chat: { type: "AIChatTab", data: { title: "Kartavya's AI Companion" } },
};
const RESUME_DOWNLOAD_SEGMENTS = ["resume", "download", "cv", "resumedownload"];

/**
 * Parses initial URL (pathname or hash) and returns { action, replaceUrl }:
 * - action: run after load + 400ms (scrollTo and/or openTab), or null for home / invalid
 * - replaceUrl: true if URL had path/hash we didn't recognize → replace with "/" and load home
 */
function getInitialUrlResult() {
  const pathname = (window.location.pathname || "").replace(/^\/+|\/+$/g, "");
  const hashRaw = (window.location.hash || "").replace(/^#+/, "");
  const pathSegments = pathname ? pathname.split("/").filter(Boolean) : [];
  const hashSegments = hashRaw ? hashRaw.split("/").filter(Boolean) : [];
  const segments = pathSegments.length > 0 ? pathSegments : hashSegments;
  const hasPathOrHash = pathname.length > 0 || hashRaw.length > 0;

  const s0 = segments[0]?.toLowerCase();
  const s1 = segments[1];

  // Modal-only: /feed, #feeds, #admin, #dashboard, /ai, #aichat, #chat
  if (MODAL_SEGMENTS[s0]) {
    if (segments.length > 1) return { action: null, replaceUrl: true };
    return { action: { openTab: MODAL_SEGMENTS[s0] }, replaceUrl: false };
  }

  // Resume download: /resume, #download, /cv, etc. — load site then trigger PDF download
  if (RESUME_DOWNLOAD_SEGMENTS.includes(s0)) {
    if (segments.length > 1) return { action: null, replaceUrl: true };
    return { action: { triggerResumeDownload: true }, replaceUrl: false };
  }

  // Projects with optional link: /projects, /projects/my-link — extra segments = invalid
  if (s0 === "projects" || s0 === "project") {
    if (segments.length > 2) return { action: null, replaceUrl: true };
    const scrollTo = "projects";
    if (s1) {
      return {
        action: {
          scrollTo,
          openTab: { type: "Project", projectLink: decodeURIComponent(s1) },
        },
        replaceUrl: false,
      };
    }
    return { action: { scrollTo }, replaceUrl: false };
  }

  // Involvement: /involvement, /involvements → experience + Involvement tab; /involvement/:link → + open that involvement in modal
  if (s0 === "involvement" || s0 === "involvements") {
    if (segments.length > 2) return { action: null, replaceUrl: true };
    const scrollTo = "experience";
    const experienceTab = "Involvement";
    if (s1) {
      return {
        action: {
          scrollTo,
          experienceTab,
          openTab: {
            type: "Involvement",
            involvementLink: decodeURIComponent(s1),
          },
        },
        replaceUrl: false,
      };
    }
    return { action: { scrollTo, experienceTab }, replaceUrl: false };
  }

  // Honors: /honors → experience + Honors tab; /honors/:link → + open that honors in modal
  if (s0 === "honors") {
    if (segments.length > 2) return { action: null, replaceUrl: true };
    const scrollTo = "experience";
    const experienceTab = "Honors";
    if (s1) {
      return {
        action: {
          scrollTo,
          experienceTab,
          openTab: {
            type: "Honors",
            honorsExperienceLink: decodeURIComponent(s1),
          },
        },
        replaceUrl: false,
      };
    }
    return { action: { scrollTo, experienceTab }, replaceUrl: false };
  }

  // Career: /career, /careers → experience + Career tab; /career/:link → + open that experience in modal
  if (s0 === "career" || s0 === "careers") {
    if (segments.length > 2) return { action: null, replaceUrl: true };
    const scrollTo = "experience";
    const experienceTab = "Career";
    if (s1) {
      return {
        action: {
          scrollTo,
          experienceTab,
          openTab: {
            type: "Experience",
            experienceLink: decodeURIComponent(s1),
          },
        },
        replaceUrl: false,
      };
    }
    return { action: { scrollTo, experienceTab }, replaceUrl: false };
  }

  // Experience(s): /experience, /experiences → scroll only; /experience/:link → resolve (career/involvement/honors) then tab + open modal
  if (s0 === "experience" || s0 === "experiences") {
    if (segments.length > 2) return { action: null, replaceUrl: true };
    const scrollTo = "experience";
    if (s1) {
      return {
        action: {
          scrollTo,
          resolveExperienceLink: decodeURIComponent(s1),
        },
        replaceUrl: false,
      };
    }
    return { action: { scrollTo }, replaceUrl: false };
  }

  // /home → just clean the URL to "/" and stay on home (no scroll)
  if (s0 === "home") {
    return { action: null, replaceUrl: true };
  }

  // Section-only scroll: about, skills, contact — exactly one segment; anything else (e.g. /about/rubbish) = invalid
  const sectionId =
    URL_TO_SECTION[s0] !== undefined
      ? URL_TO_SECTION[s0]
      : SECTION_IDS.includes(s0)
        ? s0
        : null;
  if (sectionId) {
    if (segments.length > 1) return { action: null, replaceUrl: true };
    return { action: { scrollTo: sectionId }, replaceUrl: false };
  }

  // Unrecognized path or hash → replace URL with "/" and load home (no action)
  if (hasPathOrHash) {
    return { action: null, replaceUrl: true };
  }
  return { action: null, replaceUrl: false };
}

const Root = () => {
  const [isReady, setIsReady] = useState(false);
  const [isBatterySavingOn, setIsBatterySavingOn] = useState(false);
  const [appMountDelayDone, setAppMountDelayDone] = useState(false);
  const mountedRef = React.useRef(true);
  const initialUrlResult = React.useMemo(() => getInitialUrlResult(), []);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (mountedRef.current) setAppMountDelayDone(true);
      } catch (e) {
        if (process.env.NODE_ENV !== "production")
          console.warn("[Root appMountDelayDone]", e);
      }
    }, 400);
    return () => clearTimeout(t);
  }, []);

  // Invalid path, /home, or unrecognized → replace URL with "/" and scroll to top so user is on home
  useEffect(() => {
    if (!initialUrlResult.replaceUrl) return;
    window.history.replaceState(null, "", window.location.origin + "/");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [initialUrlResult.replaceUrl]);

  return (
    <>
      {appMountDelayDone && (
        <App
          isBatterySavingOn={isBatterySavingOn}
          setIsBatterySavingOn={setIsBatterySavingOn}
          isLoadingComplete={isReady}
          initialUrlAction={initialUrlResult.action}
        />
      )}
      {!isReady && (
        <Loading
          isBatterySavingOn={isBatterySavingOn}
          setIsBatterySavingOn={setIsBatterySavingOn}
          onComplete={() => {
            try {
              if (mountedRef.current) setIsReady(true);
            } catch (e) {
              if (process.env.NODE_ENV !== "production")
                console.warn("[Root onComplete]", e);
            }
          }}
        />
      )}
    </>
  );
};

// Strict Mode for testing purposes during development
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
);
