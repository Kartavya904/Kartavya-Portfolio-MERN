import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/WindowModal.css";
import windowIcon from "../../assets/img/icons/window.svg";

// Lazy-load tab content so heavy chunks load only when the user opens that tab
const AdminTab = lazy(() => import("./AdminTab"));
const ProjectTab = lazy(() => import("./ProjectTab"));
const ExperienceTab = lazy(() => import("./ExperienceTab"));
const InvolvementTab = lazy(() => import("./InvolvementTab"));
const HonorsTab = lazy(() => import("./HonorsTab"));
const YearInReviewTab = lazy(() => import("./YearInReviewTab"));
const ProjectsListView = lazy(() => import("../ProjectPage/ProjectsListView"));
const FeedTab = lazy(() => import("./FeedTab"));
const AIChatTab = lazy(() => import("./AIChatTab"));

const TabFallback = () => (
  <div style={{ padding: 24, textAlign: "center", color: "var(--text)" }}>
    Loading…
  </div>
);

const WindowModal = ({
  tabs,
  addTab,
  setTabs,
  isClosed,
  setIsClosed,
  isMinimized,
  setIsMinimized,
  lastActiveIndex,
  setLastActiveIndex,
  scrolled,
  isBatterySavingOn,
  loggedIn,
  setLoggedIn,
  isWindowModalVisible,
  setIsWindowModalVisible,
  API_URL,
  MAX_QUERIES,
  TYPING_DELAY,
  chatStarted,
  setChatStarted,
  chatHistory,
  setChatHistory,
  loading,
  setLoading,
  query,
  setQuery,
  interimQuery,
  setInterimQuery,
  followUpSuggestions,
  setFollowUpSuggestions,
  conversationMemory,
  setConversationMemory,
  latestAIId,
  setLatestAIId,
  errorMsg,
  setErrorMsg,
  queriesSent,
  setQueriesSent,
  cancelRef,
  sendQuery,
  stopGenerating,
}) => {
  const modalRef = useRef(null);
  const toastMountedRef = useRef(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastMountedRef.current = true;
    return () => {
      toastMountedRef.current = false;
    };
  }, []);

  // every 10 seconds, wipe out all toasts
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      if (!mounted) return;
      setToasts([]);
    }, 10_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Helpers to add/remove toasts
  const addToast = (message, position) => {
    setToasts((prev) => {
      // don’t add if we already have a toast with the same message
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      const id = Date.now();
      // schedule removal
      setTimeout(() => {
        if (toastMountedRef.current) removeToast(id);
      }, 1500);
      return [...prev, { id, message, position }];
    });
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [totalTabs, setTotalTabs] = useState(0);

  useEffect(() => {
    setTotalTabs(tabs.length);
  }, [tabs]);

  useEffect(() => {
    if (tabs.length > 0 && !isClosed && !isMinimized) {
      setIsWindowModalVisible(true);
      // console.log("WindowModal is visible");
    } else {
      setIsWindowModalVisible(false);
      // console.log("WindowModal is hidden");
    }
  }, [tabs, setIsWindowModalVisible, isClosed, isMinimized]);

  // Minimize handler
  const handleMinimize = () => {
    let tabName = tabs[lastActiveIndex]?.name || "";
    if (tabName.length > 15) {
      tabName = tabName.slice(0, 15) + "...";
    }
    const right = window.innerWidth < 768 ? "70px" : "80px";
    addToast(`Minimized ${tabName} Tab`, { top: "65px", right });
    stopGenerating();
    setChatHistory([]);
    setConversationMemory("");
    setFollowUpSuggestions([]);
    setChatStarted(false);
    setIsMinimized(true);
    setIsClosed(false);
  };

  // Restore/show handler
  const handleRestore = () => {
    let tabName = tabs[lastActiveIndex]?.name || "";
    if (tabName.length > 20) {
      tabName = tabName.slice(0, 15) + "...";
    }
    // const right = window.innerWidth < 768 ? "70px" : "80px";
    // addToast(`Opened ${tabName} Tab`, { top: "65px", right });
    setIsMinimized(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        if (
          event.target.closest(".feed-nav") ||
          event.target.closest(".ai-chat-nav") ||
          event.target.closest(".navbar-toggler")
        )
          return;
        stopGenerating();
        setChatHistory([]);
        setConversationMemory("");
        setFollowUpSuggestions([]);
        setChatStarted(false);
        setIsMinimized(true); // Minimize if clicking outside
      }
    };

    // Attach event listeners
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Cleanup event listeners
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef, setIsMinimized]);

  useEffect(() => {
    const modalElement = document.querySelector(".window-modal");
    // Disable/enable scrolling
    if (!isClosed && !isMinimized) {
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      document.body.style.overflow = ""; // Enable scrolling
    }
    if (!isMinimized) {
      if (modalElement) {
        if (scrolled) {
          modalElement.style.top = "52px";
          modalElement.style.height = "calc(100dvh - 52px)";
        } else {
          modalElement.style.top = "65px";
          modalElement.style.height = "calc(100dvh - 65px)";
        }
      }
    }

    return () => {
      if (!isClosed && !isMinimized) {
        document.body.style.overflow = "hidden"; // Disable scrolling
      } else {
        document.body.style.overflow = ""; // Enable scrolling
      }
    };
  }, [isClosed, isMinimized, scrolled]);

  const renderTabContent = (type, data) => {
    const wrap = (node) =>
      node ? <Suspense fallback={<TabFallback />}>{node}</Suspense> : null;
    switch (type) {
      case "Project":
        return wrap(
          <ProjectTab data={data} isBatterySavingOn={isBatterySavingOn} />,
        );
      case "Experience":
        return wrap(
          <ExperienceTab data={data} isBatterySavingOn={isBatterySavingOn} />,
        );
      case "Involvement":
        return wrap(
          <InvolvementTab data={data} isBatterySavingOn={isBatterySavingOn} />,
        );
      case "Honors":
        return wrap(
          <HonorsTab data={data} isBatterySavingOn={isBatterySavingOn} />,
        );
      case "YearInReview":
        return wrap(
          <YearInReviewTab data={data} isBatterySavingOn={isBatterySavingOn} />,
        );
      case "ProjectsListView":
        return wrap(
          <ProjectsListView
            addTab={addTab}
            isBatterySavingOn={isBatterySavingOn}
            showStarred={false}
          />,
        );
      case "Admin":
        return wrap(
          <AdminTab
            data={data}
            isBatterySavingOn={isBatterySavingOn}
            loggedIn={loggedIn}
            setLoggedIn={setLoggedIn}
          />,
        );
      case "FeedTab":
        return wrap(<FeedTab isBatterySavingOn={isBatterySavingOn} />);
      case "AIChatTab":
        return wrap(
          <AIChatTab
            scrolled={scrolled}
            isMinimized={isMinimized}
            isClosed={isClosed}
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
          />,
        );
      default:
        return null;
    }
  };

  const closeTab = (index) => {
    let tabName = tabs[lastActiveIndex]?.name || "";
    const updatedTabs = tabs
      .filter((tab) => tab.index !== index)
      .map((tab) => ({
        ...tab,
        index: tab.index > index ? tab.index - 1 : tab.index,
      }));

    setTabs(updatedTabs);

    if (updatedTabs.length === 0) {
      setLastActiveIndex(0);
      setIsClosed(true);
      setIsMinimized(false); // Reset minimization
    } else if (lastActiveIndex >= index) {
      if (tabName.length > 15) {
        tabName = tabName.slice(0, 15) + "...";
      }
      // const right = window.innerWidth < 768 ? "70px" : "80px";
      // addToast(`Closed ${tabName} Tab`, { top: "65px", right });
      setLastActiveIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleCloseModal = () => {
    // addToast(`Closed Portfolio Explorer`, { top: "65px", right: "20px" });
    stopGenerating();
    setChatHistory([]);
    setConversationMemory("");
    setFollowUpSuggestions([]);
    setChatStarted(false);
    setTabs([]);
    setLastActiveIndex(0);
    setIsClosed(true);
    setIsMinimized(false); // Reset minimization
  };

  // Close modal on Escape when expanded (improves UX and testability)
  useEffect(() => {
    if (tabs.length === 0 || isClosed || isMinimized) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tabs.length, isClosed, isMinimized]);

  useEffect(() => {
    // Automatically restore the modal if it is minimized and a new tab is added
    if (isMinimized && tabs.length > 0) {
      setLastActiveIndex(tabs.length - 1);
      setIsMinimized(false);
      setIsClosed(false);
    }
  }, [tabs]);

  useEffect(() => {
    const updateScale = () => {
      const windowContent = document.querySelector(".window-content");
      const minimizedIcon = document.querySelector(".minimized-icon");
      if (!windowContent && !minimizedIcon) return;
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      let scaleValue = 1;
      if (screenHeight < 826 && screenWidth > 576) {
        scaleValue = screenHeight / 826;
      }
      if (windowContent) {
        windowContent.style.zoom = `${scaleValue}`;
      }
      if (minimizedIcon) {
        minimizedIcon.style.height = `${scaleValue}`;
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [tabs, isMinimized, isClosed]);

  return (
    <>
      {/* Toast notifications */}
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              position: "fixed",
              top: t.position.top,
              right: t.position.right,
              zIndex: 9999,
            }}
          >
            <div className="toast-item">
              <span className="toast-message">{t.message}</span>
              <button
                className="toast-close-btn"
                onClick={() => removeToast(t.id)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Window Modal */}
      <AnimatePresence>
        {!isClosed ? (
          isMinimized ? (
            <motion.div
              className="minimized-icon"
              onClick={handleRestore}
              title="Click to maximize"
              initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
              animate={isBatterySavingOn ? {} : { opacity: 1, scale: 1 }}
              exit={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.3}
              dragTransition={{
                bounceStiffness: 250,
                bounceDamping: 15,
              }}
              // whileInView={{ opacity: 1, scale: 1 }}
              whileHover={isBatterySavingOn ? {} : { scale: 1.1 }}
              whileTap={isBatterySavingOn ? {} : { scale: 0.9, rotate: 360 }}
              transition={
                isBatterySavingOn
                  ? {}
                  : { duration: 0, delay: 0, type: "spring" }
              }
            >
              <motion.div className="minimized-icon-image">
                <motion.img
                  className="icon-image"
                  initial={
                    isBatterySavingOn ? {} : { opacity: 0, scale: 0, rotate: 0 }
                  }
                  animate={
                    isBatterySavingOn
                      ? {}
                      : { opacity: 1, scale: 1, rotate: 360 }
                  }
                  exit={
                    isBatterySavingOn ? {} : { opacity: 0, scale: 0, rotate: 0 }
                  }
                  transition={
                    isBatterySavingOn
                      ? {}
                      : { duration: 0.5, delay: 0, type: "spring" }
                  }
                  src={windowIcon}
                  drag="false"
                  alt=""
                />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              className="window-modal"
              ref={modalRef}
              initial={
                isBatterySavingOn
                  ? {}
                  : {
                      scale: [
                        0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
                      ],
                      opacity: [
                        0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
                      ],
                    }
              }
              animate={
                isBatterySavingOn
                  ? {}
                  : {
                      scale: [
                        0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
                      ],
                      opacity: [
                        0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
                      ],
                    }
              }
              exit={
                isBatterySavingOn
                  ? {}
                  : {
                      scale: [
                        1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0,
                      ],
                      opacity: [
                        1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0,
                      ],
                    }
              }
              transition={
                isBatterySavingOn
                  ? {}
                  : { type: "ease", delay: 0, duration: 0.5 }
              }
              onLoad={handleRestore}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="window-content">
                <motion.div className="header-bar">
                  <div className="header-text">
                    Portfolio Explorer | Items: {totalTabs}/3
                  </div>
                </motion.div>
                <motion.div className="title-bar">
                  <div className="tabs">
                    {tabs.map((tab) => (
                      <div
                        key={`tab-${tab.index}`}
                        className={`tab ${
                          lastActiveIndex === tab.index ? "active" : ""
                        }`}
                        onClick={() => setLastActiveIndex(tab.index)}
                      >
                        <div className="tab-title">{tab.name}</div>
                        <div
                          className="close-tab"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.index);
                          }}
                        >
                          ✕
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="controls">
                    <button
                      className="control-btn minimize"
                      onClick={handleMinimize}
                    >
                      —
                    </button>
                    <button
                      className="control-btn close"
                      onClick={handleCloseModal}
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
                <motion.div
                  className="content"
                  // key={lastActiveIndex}
                  initial={isBatterySavingOn ? {} : { scale: 0, opacity: 0 }}
                  whileInView={
                    isBatterySavingOn ? {} : { scale: 1, opacity: 1 }
                  }
                  exit={isBatterySavingOn ? {} : { scale: 0, opacity: 0 }}
                  transition={isBatterySavingOn ? {} : { type: "ease" }}
                >
                  {tabs.length > 0 &&
                    renderTabContent(
                      tabs[lastActiveIndex]?.type,
                      tabs[lastActiveIndex]?.data,
                    )}
                </motion.div>
              </div>
            </motion.div>
          )
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default WindowModal;
