import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  lazy,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { animated } from "@react-spring/web";
import axios from "axios";
import { AppLoad } from "./services/variants";
import "./App.css";
import Links from "./components/SpecialComponents/Links";
import NavBar from "./components/SpecialComponents/NavBar";
import PowerMode from "./components/SpecialComponents/PowerMode";
// Lazy load major page components for code splitting
const HomePage = lazy(() => import("./components/HomePage/HomePage"));
const AboutPage = lazy(() => import("./components/AboutPage/AboutPage"));
const SkillPage = lazy(() => import("./components/SkillPage/SkillPage"));
const ExperiencePage = lazy(() =>
  import("./components/ExperiencePage/ExperiencePage")
);
const ProjectPage = lazy(() => import("./components/ProjectPage/ProjectPage"));
const ContactPage = lazy(() => import("./components/ContactPage/ContactPage"));
const WindowModal = lazy(() => import("./components/WindowModal/WindowModal"));
// import { cleanupEventListeners } from "./services/eventListenerRegistry";

function App({ isBatterySavingOn, setIsBatterySavingOn }) {
  const [scrolled, setScrolled] = useState(window.scrollY > 100);
  const [loggedIn, setLoggedIn] = useState(false);
  const [tabs, setTabs] = useState([]); // Tabs state for WindowModal
  const [isClosed, setIsClosed] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false); // Track if modal is minimized
  const [lastActiveIndex, setLastActiveIndex] = useState(0); // Track active tab index
  const [isWindowModalVisible, setIsWindowModalVisible] = useState(false);

  const API_URL = process.env.REACT_APP_API_URI;
  const MAX_QUERIES = 20;
  const TYPING_DELAY = 0; // ms per character
  const [chatStarted, setChatStarted] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // {id, sender, text}
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [interimQuery, setInterimQuery] = useState("");
  const [followUpSuggestions, setFollowUpSuggestions] = useState([]);
  const [conversationMemory, setConversationMemory] = useState("");
  const [latestAIId, setLatestAIId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [queriesSent, setQueriesSent] = useState(0);
  const cancelRef = useRef(false);

  const [showChatTip, setShowChatTip] = useState(() => {
    // hide forever if user previously closed
    return localStorage.getItem("hideAIChatTip") !== "true";
  });

  const dismissChatTip = () => {
    setShowChatTip(false);
    localStorage.setItem("hideAIChatTip", "true");
  };

  // useEffect(() => {
  //   const cleanupInterval = setInterval(() => {
  //     // Clean up listeners that haven't been active for over 60 seconds
  //     const remainingListeners = cleanupEventListeners(1000);
  //     // Optionally, you can log or set state with the remaining listeners count
  //     console.log("Remaining listeners:", remainingListeners.length);
  //   }, 10000);

  //   return () => clearInterval(cleanupInterval);
  // }, []);

  const addTab = useCallback((type, data) => {
    if (!data || typeof data !== "object") {
      console.error("Invalid data passed to addTab:", data);
      return;
    }

    setTabs((prev) => {
      const existingTabIndex = prev.findIndex(
        (tab) =>
          tab.name ===
          (data.title ||
            data.projectTitle ||
            data.experienceTitle ||
            data.honorsExperienceTitle ||
            data.involvementTitle ||
            data.yearInReviewTitle ||
            data.adminTitle)
      );

      if (existingTabIndex !== -1) {
        // If the tab exists, set the active index and return the unchanged array
        setIsClosed(false); // Ensure the modal is visible
        setIsMinimized(false); // Ensure the modal is not minimized
        setLastActiveIndex(existingTabIndex);
        // console.log(
        //   "Tab already exists, switching to existing tab:",
        //   prev[existingTabIndex]
        // );
        return prev;
      }

      if (prev.length === 3) {
        // Shift all tabs forward
        const updatedTabs = prev
          .map((tab, idx) => {
            if (idx === 0) return null; // Drop the first tab
            return { ...tab, index: idx - 1 }; // Adjust the index of the rest
          })
          .filter(Boolean); // Remove the null first element

        const newTab = {
          index: updatedTabs.length,
          type,
          data,
          name:
            data.title ||
            data.projectTitle ||
            data.experienceTitle ||
            data.honorsExperienceTitle ||
            data.involvementTitle ||
            data.yearInReviewTitle ||
            data.adminTitle ||
            `Tab ${updatedTabs.length + 1}`,
        };

        const result = [...updatedTabs, newTab];
        setLastActiveIndex(result.length - 1); // Set the last active index to the new tab
        // console.log("Tabs after addition (3 tabs max):", result);
        return result;
      }

      const newTab = {
        index: prev.length,
        type,
        data,
        name:
          data.title ||
          data.projectTitle ||
          data.experienceTitle ||
          data.honorsExperienceTitle ||
          data.involvementTitle ||
          data.yearInReviewTitle ||
          data.adminTitle ||
          `Tab ${prev.length + 1}`,
      };
      const result = [...prev, newTab];
      setLastActiveIndex(result.length - 1); // Set the last active index to the new tab
      // console.log("Tabs after addition:", result);
      return result;
    });

    setIsClosed(false);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // add this at the top of your component file
  const delay = useCallback(
    (ms) => new Promise((res) => setTimeout(res, ms)),
    []
  );

  // memoize sendQuery so its identity only changes when its inputs change
  const sendQuery = useCallback(
    async (userQuery) => {
      setQuery("");
      setInterimQuery("");
      const trimmed = userQuery.trim();
      if (!trimmed) return;
      if (queriesSent >= MAX_QUERIES) {
        setErrorMsg(
          `You’ve reached your ${MAX_QUERIES}‑query/day limit. Try again tomorrow.`
        );
        return;
      }
      if (!chatStarted) setChatStarted(true);
      setErrorMsg("");
      setFollowUpSuggestions([]);
      cancelRef.current = false;

      // 0) Insert user bubble
      const userId = Date.now();
      setChatHistory((h) => [
        ...h,
        { id: userId, sender: "user", text: trimmed },
      ]);

      // 1) Insert AI bubble → "Thinking..."
      setLoading(true);
      const aiId = userId + 1;
      setChatHistory((h) => [
        ...h,
        { id: aiId, sender: "ai", text: "Thinking..." },
      ]);
      // 1) get optimized query
      const { data: optRes } = await axios.post(
        `${API_URL}/ai/optimize-query`,
        { query: trimmed, conversationMemory }
      );
      const optimized = optRes.optimizedQuery || trimmed;
      console.log(optimized);
      await delay(300); // let UI settle

      if (!cancelRef.current) {
        setChatHistory((h) =>
          h.map((m) =>
            m.id === aiId ? { ...m, text: "Gathering Context..." } : m
          )
        );
      }
      // 3) Fire the main chat API
      const askPromise = axios.post(`${API_URL}/ai/ask-chat`, {
        query: optimized,
        conversationMemory,
      });
      // 4) Stage transitions
      await delay(300);

      try {
        // 7) Show “Generating Response…”
        if (!cancelRef.current) {
          setChatHistory((h) =>
            h.map((m) =>
              m.id === aiId ? { ...m, text: "Generating Response..." } : m
            )
          );
        }
        // 5) Await the answer
        const { data } = await askPromise;
        if (cancelRef.current) throw new Error("cancelled");
        const answerText = data.answer || "";
        await delay(300);

        // 6) Immediately kick off follow‑ups
        const suggestPromise = axios.post(
          `${API_URL}/ai/suggestFollowUpQuestions`,
          {
            query: optimized,
            response: answerText,
            conversationMemory: conversationMemory,
          }
        );

        // 8) Snapshot memory
        const memRes = await axios.post(`${API_URL}/ai/snapshotMemoryUpdate`, {
          previousMemory: conversationMemory,
          query: optimized,
          response: answerText,
        });
        if (cancelRef.current) throw new Error("cancelled");
        // 7) Show “Updating Conversation Memory & Formatting Response…”
        if (!cancelRef.current) {
          setChatHistory((h) =>
            h.map((m) =>
              m.id === aiId
                ? { ...m, text: "Updating Conversation Memory…" }
                : m
            )
          );
        }
        const newMem = memRes.data.memory;
        setConversationMemory(newMem);
        localStorage.setItem("conversationMemory", newMem);
        await delay(300);

        // 9) Increment count
        const newCount = queriesSent + 1;
        setQueriesSent(newCount);
        localStorage.setItem("queriesSent", String(newCount));

        // 1️⃣1️⃣ Mark latest AI bubble
        setLatestAIId(aiId);

        // 🔟 Typewriter reveal, two letters at a time
        let built = "";
        for (let i = 0; i < answerText.length; i += 3) {
          if (cancelRef.current) break;

          // take 2 chars (or whatever remains)
          built += answerText.slice(i, i + 3);

          // capture the current snapshot
          const textToShow = built;

          // now this callback only ever references textToShow, which is
          // a fresh const on each iteration
          setChatHistory((h) =>
            h.map((m) => (m.id === aiId ? { ...m, text: textToShow } : m))
          );

          await delay(TYPING_DELAY);
        }

        // 1️⃣2️⃣ Await and display follow‑ups immediately
        try {
          const followRes = await suggestPromise;
          if (!cancelRef.current) {
            setFollowUpSuggestions(followRes.data.suggestions || []);
          }
        } catch {
          /* ignore */
        }

        setLoading(false);
      } catch (err) {
        if (!cancelRef.current) console.error(err);
        setChatHistory((h) =>
          h.map((m) =>
            m.id === aiId
              ? {
                  ...m,
                  text: cancelRef.current
                    ? `${m.text} [Generation stopped]`
                    : "Sorry, something went wrong.",
                }
              : m
          )
        );
        setLoading(false);
      } finally {
        setQuery("");
      }
    },
    [chatStarted, conversationMemory, delay, queriesSent, API_URL]
  );

  // --- Stop generation handler ---
  const stopGenerating = useCallback(() => {
    setChatHistory((h) =>
      h.map((msg) =>
        msg.id === latestAIId
          ? { ...msg, text: msg.text + "... [Generation stopped]" }
          : msg
      )
    );

    // 1) signal your existing cancel flag
    cancelRef.current = true;

    // 2) clear the loading spinner
    setLoading(false);
  }, [latestAIId]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="App"
        variants={AppLoad("down")}
        initial="initial"
        animate={"show"}
      >
        <PowerMode
          isBatterySavingOn={isBatterySavingOn}
          setIsBatterySavingOn={setIsBatterySavingOn}
          scrolled={scrolled}
        />
        <NavBar isBatterySavingOn={isBatterySavingOn} addTab={addTab} />
        <Suspense fallback={null}>
          <HomePage
            isBatterySavingOn={isBatterySavingOn}
            scrolled={scrolled}
            addTab={addTab}
            sendQuery={sendQuery}
          />
        </Suspense>
        {/* {isWindowModalVisible && (
          <>
                  <AboutPage isBatterySavingOn={isBatterySavingOn} />
        <SkillPage isBatterySavingOn={isBatterySavingOn} />
        <ProjectPage addTab={addTab} isBatterySavingOn={isBatterySavingOn} />
        <ExperiencePage addTab={addTab} isBatterySavingOn={isBatterySavingOn} />
          </>
        )} */}
        <Suspense fallback={null}>
          <AboutPage
            isBatterySavingOn={isBatterySavingOn}
            isWindowModalVisible={isWindowModalVisible}
            addTab={addTab}
          />
        </Suspense>
        <Suspense fallback={null}>
          <SkillPage
            isBatterySavingOn={isBatterySavingOn}
            isWindowModalVisible={isWindowModalVisible}
          />
        </Suspense>
        <div
          style={{
            display: "sticky",
            top: 0,
            bottom: 0,
            width: "100%",
            // height: "calc(100vh - 52px)",
            height: "auto",
            overflow: "show",
          }}
        >
          <Suspense fallback={null}>
            <ProjectPage
              addTab={addTab}
              isBatterySavingOn={isBatterySavingOn}
              isWindowModalVisible={isWindowModalVisible}
            />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <ExperiencePage
            addTab={addTab}
            isBatterySavingOn={isBatterySavingOn}
            isWindowModalVisible={isWindowModalVisible}
          />
        </Suspense>
        <Suspense fallback={null}>
          <ContactPage isBatterySavingOn={isBatterySavingOn} addTab={addTab} />
        </Suspense>
        <Links
          isBatterySavingOn={isBatterySavingOn}
          isWindowModalVisible={isWindowModalVisible}
        />
        {/* <a
          className={`scroll-to-top ${scrolled ? "show" : ""}`}
          href="#page-top"
          onClick={scrollToTop}
        >
          <i className="fa fa-angle-up"></i>
        </a> */}
        {!isWindowModalVisible && (
          <div className="ai-chat-container">
            {/* Tooltip
            {showChatTip && (
              <div className="ai-chat-tooltip">
                <span
                  className="close-btn"
                  onClick={dismissChatTip}
                  aria-label="Close"
                >
                  x
                </span>
                Chat with my AI companion to explore my projects and
                experiences.
              </div>
            )} */}
            <motion.div
              className={`ai-chat-btn`}
              onClick={() => {
                addTab("AIChatTab", { title: "Kartavya's AI Companion" });
              }}
              title="Links"
              initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.3}
              dragTransition={{
                bounceStiffness: 250,
                bounceDamping: 15,
              }}
              whileInView={isBatterySavingOn ? {} : { opacity: 1, scale: 1 }}
              whileHover={isBatterySavingOn ? {} : { scale: 1.1 }}
              whileTap={isBatterySavingOn ? {} : { scale: 0.9 }}
              transition={isBatterySavingOn ? {} : { delay: 0, type: "spring" }}
            >
              <animated.img
                src={require("./assets/img/icons/aichat.png")}
                alt="AI Chat Bot"
                className="icon-img"
                draggable="false"
                loading="eager"
              />
            </motion.div>
          </div>
        )}
        <Suspense fallback={null}>
          <WindowModal
            tabs={tabs}
            addTab={addTab}
            setTabs={setTabs}
            isClosed={isClosed}
            setIsClosed={setIsClosed}
            isMinimized={isMinimized}
            setIsMinimized={setIsMinimized}
            lastActiveIndex={lastActiveIndex}
            setLastActiveIndex={setLastActiveIndex}
            scrolled={scrolled}
            isBatterySavingOn={isBatterySavingOn}
            loggedIn={loggedIn}
            setLoggedIn={setLoggedIn}
            isWindowModalVisible={isWindowModalVisible}
            setIsWindowModalVisible={setIsWindowModalVisible}
            API_URL={API_URL}
            MAX_QUERIES={MAX_QUERIES}
            TYPING_DELAY={TYPING_DELAY}
            chatStarted={chatStarted}
            setChatStarted={setChatStarted}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            loading={loading}
            setLoading={setLoading}
            query={query}
            setQuery={setQuery}
            interimQuery={interimQuery}
            setInterimQuery={setInterimQuery}
            followUpSuggestions={followUpSuggestions}
            setFollowUpSuggestions={setFollowUpSuggestions}
            conversationMemory={conversationMemory}
            setConversationMemory={setConversationMemory}
            latestAIId={latestAIId}
            setLatestAIId={setLatestAIId}
            errorMsg={errorMsg}
            setErrorMsg={setErrorMsg}
            queriesSent={queriesSent}
            setQueriesSent={setQueriesSent}
            cancelRef={cancelRef}
            sendQuery={sendQuery}
            stopGenerating={stopGenerating}
          />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
