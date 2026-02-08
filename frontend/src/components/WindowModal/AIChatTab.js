// AIChatTab.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSpeechInput } from "../../hooks/useSpeechInput";
import { useSpring, animated } from "@react-spring/web";
import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
import { scale, zoomIn } from "../../services/variants";
import { motion } from "framer-motion";
import "../../styles/AIChatBot.css";

const TOAST_THRESHOLD = 5;

const AIChatBot = ({
  scrolled,
  isMinimized,
  isClosed,
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
  const [hasSavedChat, setHasSavedChat] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const { listening, supported, permission, start, stop } = useSpeechInput({
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        setSpoken(true);
        // append final transcript onto existing query
        setQuery((q) => q + " " + transcript);
        setInterimQuery("");
      } else {
        setInterimQuery(transcript);
      }
    },
  });
  const micDisabled = !supported || permission === "denied";
  // ── AUDIO PLAYBACK STATE ───────────────────────────────────────
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPaused, setAudioPaused] = useState(false);
  const [audioCurrent, setAudioCurrent] = useState(0); // seconds elapsed
  const [audioDuration, setAudioDuration] = useState(0); // total seconds
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [showToast, setShowToast] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // --- Daily reset & restore ---
  useEffect(() => {
    try {
      const storedDate = localStorage.getItem("lastUpdated");
      const today = new Date().toISOString().slice(0, 10);
      if (storedDate !== today) {
        localStorage.setItem("queriesSent", "0");
        localStorage.setItem("conversationMemory", "");
        localStorage.removeItem("conversationHistory");
        localStorage.setItem("lastUpdated", today);
        setChatStarted(false);
        setChatHistory([]);
        setQueriesSent(0);
        setConversationMemory("");
      } else {
        const sent = parseInt(localStorage.getItem("queriesSent") || "0", 10);
        setQueriesSent(isNaN(sent) ? 0 : sent);
        setConversationMemory(localStorage.getItem("conversationMemory") || "");
        const saved = localStorage.getItem("conversationHistory");
        setHasSavedChat(!!(saved && JSON.parse(saved).length));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem("conversationHistory", JSON.stringify(chatHistory));
    } else {
      // localStorage.removeItem("conversationHistory");
    }
  }, [chatHistory]);

  // --- Load reactive avatar ---
  const [clicked, setClicked] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const clickCount = useRef(0); // Use useRef to keep track of click count across renders
  const [key, setKey] = useState(0); // State to reset the animation on click
  const [frameIndex, setFrameIndex] = useState(0); // Track current frame index
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const frames = ["", " frame1", " frame2", " frame3"]; // Define frame styles
  const handleProfileClick = () => {
    setFrameIndex((prevIndex) => (prevIndex + 1) % frames.length); // Cycle frames
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (clientX - (rect.left + rect.width / 2)) / 10;
    const y = (clientY - (rect.top + rect.height / 2)) / 10;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const { boxShadow } = useSpring({
    boxShadow: clicked
      ? "0px 15px 30px rgba(0, 0, 0, 0.3)"
      : "0px 8px 15px rgba(0, 0, 0, 0.1)",
    config: { duration: 100, tension: 300, friction: 10 },
    onRest: () => setClicked(false),
  });

  const handleClick = () => {
    if (isCooldown) return; // Prevent clicks during cooldown

    setClicked(true); // Trigger animation
    clickCount.current += 1;

    if (clickCount.current >= 5) {
      setIsCooldown(true);
      clickCount.current = 0;

      setTimeout(() => {
        if (mountedRef.current) setIsCooldown(false);
      }, 1000);
    }
  };

  // Effect to reset click count if no further clicks are registered within 5 seconds
  useEffect(() => {
    if (clickCount.current > 0 && !isCooldown) {
      const resetTimeout = setTimeout(() => {
        clickCount.current = 0;
      }, 5000);

      return () => clearTimeout(resetTimeout); // Clean up timeout
    }
  }, [isCooldown]);

  // --- Auto‑scroll ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  // --- Toast logic ---
  useEffect(() => {
    setShowToast(
      queriesSent >= MAX_QUERIES - TOAST_THRESHOLD &&
        queriesSent <= MAX_QUERIES,
    );
  }, [queriesSent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuery(query);
  };
  const handleSuggestionClick = (s) => sendQuery(s);

  // --- Bubble action handlers ---
  const handleCopy = (text) => navigator.clipboard.writeText(text);
  const handleEdit = (text) => {
    setQuery(text);
    inputRef.current?.focus();
  };
  const handleThumb = (up) => console.log(up ? "👍" : "👎");
  const handleReadAloud = (text) => {
    // cancel any previous speech
    speechSynthesis.cancel();
    clearInterval(timerRef.current);

    // estimate duration (words ÷ 2.5 words/sec)
    const words = text.trim().split(/\s+/).length;
    const duration = Math.max(1, words / 2.5);
    setAudioDuration(duration);
    setAudioCurrent(0);

    // create utterance
    const utt = new SpeechSynthesisUtterance(text);
    utt.onend = () => {
      clearInterval(timerRef.current);
      if (mountedRef.current) setAudioPlaying(false);
    };

    // start speaking
    speechSynthesis.speak(utt);
    setAudioPlaying(true);
    setAudioPaused(false);

    // start timer to tick current time
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setAudioCurrent((t) => {
        if (t + 0.5 >= duration) {
          clearInterval(timerRef.current);
          return duration;
        }
        return t + 0.5;
      });
    }, 500);
  };

  // Pause the speech
  const handleAudioPause = () => {
    speechSynthesis.pause();
    clearInterval(timerRef.current);
    setAudioPaused(true);
  };

  // Resume from pause
  const handleAudioResume = () => {
    speechSynthesis.resume();
    setAudioPaused(false);
    // restart timer
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setAudioCurrent((t) => Math.min(t + 0.5, audioDuration));
    }, 500);
  };

  // Fully stop playback
  const handleAudioStop = () => {
    speechSynthesis.cancel();
    clearInterval(timerRef.current);
    setAudioPlaying(false);
    setAudioPaused(false);
    setAudioCurrent(0);
  };

  const handleRegenerate = (id) => {
    // find prior user message
    const idx = chatHistory.findIndex((m) => m.id === id);
    if (idx > 0 && chatHistory[idx - 1].sender === "user") {
      sendQuery(chatHistory[idx - 1].text);
    }
  };

  // ── EXTRA PADDING ON LAST MESSAGE WHEN AUDIO PLAYING ────────────
  useEffect(() => {
    // 1) grab your messages container via chatEndRef
    const container = chatEndRef.current?.parentElement;
    if (!container) return;

    // 2) get all .message nodes
    const msgs = Array.from(container.querySelectorAll(".message"));
    if (msgs.length === 0) return;

    // 3) clear any inline padding-bottom we set before
    msgs.forEach((m) => {
      m.style.marginBottom = "";
    });

    // 4) if audio is playing, compute & add 20px to the last message
    if (audioPlaying) {
      const last = msgs[msgs.length - 1];
      // read the computed CSS padding-bottom (e.g. "12px")
      const comp = window.getComputedStyle(last).paddingBottom;
      const current = parseFloat(comp) || 0;
      last.style.marginBottom = `20px`;
    }
  }, [audioPlaying, chatHistory]);

  // ── STOP AUDIO WHEN MINIMIZED, CLOSED, OR UNMOUNT ───────────
  useEffect(() => {
    // if the modal/tab is minimized or closed, stop playback immediately
    if ((isMinimized || isClosed) && audioPlaying) {
      handleAudioStop();
    }
    // cleanup on unmount as well
    return () => {
      handleAudioStop();
    };
  }, [isMinimized, isClosed]);

  const starterQuestions = [
    "What skills have your developed from your experiences?",
    "Tell me about your full stack development experiences and projects journey.",
    "What are your top skills, what is your proficiency and how did you acquire them?",
  ];

  return (
    <div className={chatStarted ? "chat-container" : "intro-container"}>
      {/* toast */}
      {showToast && (
        <motion.div
          className="toast"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          whileHover={{
            scale: 1.01,
            transition: { delay: 0 },
          }}
          whileTap={{
            scale: 0.99,
            transition: { delay: 0 },
          }}
          transition={{ duration: 0.25 }}
        >
          <span>You have {MAX_QUERIES - queriesSent} queries left today.</span>
          <motion.button
            whileHover={{
              scale: 1.05,
              transition: { delay: 0 },
              color: "lightcoral",
            }}
            whileTap={{
              scale: 0.95,
              transition: { delay: 0 },
            }}
            className="toast-close"
            onClick={() => setShowToast(false)}
          >
            ×
          </motion.button>
        </motion.div>
      )}

      {chatStarted && (
        <motion.div
          className="chat-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, type: "ease", duration: 0.2 }}
        >
          <motion.i
            className="fa fa-sync"
            title="Restart Chat"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "ease" }}
            whileHover={{
              scale: 1.1,
              transition: { delay: 0 },
            }}
            whileTap={{
              scale: 0.9,
              transition: { delay: 0 },
            }}
            onClick={() => {
              setChatStarted(false);
              setChatHistory([]);
              setHasSavedChat(false);
              setConversationMemory("");
              localStorage.removeItem("conversationHistory");
              localStorage.removeItem("conversationMemory");
            }}
          />
          <h2 className="chat-title proficient" style={{ flexGrow: 1 }}>
            Kartavya's AI Companion
          </h2>
        </motion.div>
      )}

      {!chatStarted ? (
        <div className="intro-card">
          {/* If we have a saved chat, ask the user what they want: */}
          {hasSavedChat ? (
            <motion.div
              className="continue-prompt"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "ease", scale: { delay: 0 } }}
              whileHover={{
                scale: 1.05,
                transition: { delay: 0 },
              }}
              whileTap={{
                scale: 0.95,
                transition: { delay: 0 },
              }}
            >
              <button
                className="btn-continue"
                onClick={() => {
                  // load the saved chat
                  const saved = JSON.parse(
                    localStorage.getItem("conversationHistory") || "[]",
                  );
                  setChatHistory(saved);
                  setConversationMemory(
                    localStorage.getItem("conversationMemory") || "",
                  );
                  setQueriesSent(
                    parseInt(localStorage.getItem("queriesSent") || "0", 10),
                  );
                  setChatStarted(true);
                }}
              >
                Continue from previous chat{" "}
                <i className="fa fa-arrow-right" aria-hidden="true" />
              </button>
            </motion.div>
          ) : null}
          <motion.div
            className={`profile-picture-container`}
            variants={zoomIn(0.6)}
            style={{
              width: "fit-content",
              height: "auto",
              justifySelf: "center",
              display: "flex",
              // marginBottom: "20px",
            }}
            initial="hidden"
            animate="show"
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.3}
            dragTransition={{
              bounceStiffness: 250,
              bounceDamping: 15,
            }}
            transition={{ scale: { delay: 0, type: "easeInOut" } }}
            whileTap={{
              scale: 1.1,
              transition: { delay: 0, type: "spring" },
            }}
          >
            <animated.img
              src={`${process.env.PUBLIC_URL}/system-user.webp`}
              alt="Profile"
              className={` img-responsive img-circle${frames[frameIndex]}`}
              draggable="false"
              style={{
                boxShadow,
                transform: isHovering
                  ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) scale3d(1.03, 1.03, 1.03)`
                  : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
                transition: "transform 0.1s ease-out",
              }}
              // onHover={{ border: "4px solid #fcbc1d !important" }}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                handleClick();
                handleProfileClick();
              }}
            />
          </motion.div>
          {/* <img
            src={`${process.env.PUBLIC_URL}/system-user.webp`}
            alt="AI"
            className="avatar intro-avatar"
          /> */}
          <motion.h2
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "ease" }}
            className="chat-title proficient"
          >
            Kartavya's AI Companion
          </motion.h2>
          <motion.h4
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "ease" }}
            className="chat-subtitle"
          >
            Meet my AI Companion: He knows all about my journey and loves to
            share.
          </motion.h4>
          <motion.p
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "ease" }}
            className="suggestion-header"
          >
            Try asking:
          </motion.p>
          <ul className="suggestions-list">
            {starterQuestions.map((q, i) => (
              <motion.li
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 1 + 0.1 * i,
                  type: "ease",
                  scale: { delay: 0, type: "easeInOut" },
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { delay: 0, type: "ease" },
                }}
                whileTap={{
                  scale: 0.95,
                  transition: { delay: 0, type: "ease" },
                }}
                key={i}
                className="suggestion-item"
                onClick={() => {
                  handleSuggestionClick(q);
                  setChatStarted(true);
                  localStorage.setItem(
                    "conversationHistory",
                    JSON.stringify([]),
                  );
                  localStorage.setItem("conversationMemory", "");
                }}
              >
                {q}
              </motion.li>
            ))}
          </ul>
          <motion.form
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, scale: { delay: 0, type: "ease" } }}
            whileHover={{
              scale: 1.1,
              transition: { delay: 0, type: "easeInOut" },
            }}
            whileTap={{
              scale: 1.075,
              transition: { delay: 0, type: "easeInOut" },
            }}
            onSubmit={handleSubmit}
            className="input-form glass"
            style={{ position: "relative", background: "#343a40" }}
          >
            <motion.div
              className="mic-btn-container"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.3}
              dragTransition={{
                bounceStiffness: 250,
                bounceDamping: 15,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.button
                type="button"
                className={`mic-btn glass ${listening ? "active" : ""}`}
                // onMouseDown={start}
                // onMouseUp={stop}
                // onTouchStart={start}
                // onTouchEnd={stop}
                style={
                  listening
                    ? { background: "#fcbc1d" }
                    : { background: "#5a6268" }
                }
                whileHover={{ background: "#fcbc1d" }}
                onClick={() => (listening ? stop() : start())}
                aria-label={listening ? "Click to stop" : "Click to talk"}
                disabled={loading || micDisabled}
              >
                <i
                  style={
                    listening ? { color: "#212529" } : { color: "#edeeef" }
                  }
                  className={`fa fa-microphone${listening ? "" : "-slash"}`}
                />
              </motion.button>
            </motion.div>
            <input
              ref={inputRef}
              type="text"
              value={listening ? interimQuery : query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`${
                loading
                  ? "Generating Response..."
                  : listening
                    ? "Transcribing... Please ask!"
                    : "Ask any question about me!"
              }`}
              onKeyDown={(e) => {
                // Enter=send, Shift+Enter=newline
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="query-input"
              disabled={loading}
            />
            <motion.button
              type="button"
              className="send-float-btn"
              animate={{ translateY: "-50%" }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.3}
              dragTransition={{
                bounceStiffness: 250,
                bounceDamping: 15,
              }}
              whileHover={{
                scale: 1.1,
                translateY: "-50%",
                transition: { delay: 0 },
              }}
              whileTap={{
                scale: 0.9,
                translateY: "-50%",
                transition: { delay: 0 },
              }}
              onClick={() => (loading ? stopGenerating() : sendQuery(query))}
            >
              <motion.i
                drag="false"
                className={`fa ${loading ? "fa-stop" : "fa-arrow-up"}`}
              />
            </motion.button>
          </motion.form>
        </div>
      ) : (
        <>
          <div className="chat-messages">
            <div className="message-window">
              {chatHistory.map((msg, id) => (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ scale: { delay: 0, type: "spring" } }}
                  key={msg.id}
                  className={`message ${msg.sender}`}
                >
                  <motion.img
                    src={`${process.env.PUBLIC_URL}/${
                      msg.sender === "ai" ? "system-user.webp" : "user-icon.svg"
                    }`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: msg.sender === "ai" ? 0.5 : 0.3,
                      type: "ease",
                      scale: { delay: 0, type: "ease" },
                    }}
                    whileHover={{
                      scale: 1.05,
                      transition: { delay: 0 },
                    }}
                    whileTap={{
                      scale: 0.95,
                      transition: { delay: 0 },
                    }}
                    alt={msg.sender}
                    className={`avatar ${msg.sender}-avatar`}
                  />
                  <motion.div
                    className="bubble-container"
                    initial={{
                      opacity: 0,
                      x: msg.sender === "ai" ? -40 : 40,
                      y: 10,
                      scale: 0.8,
                    }}
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    transition={{
                      delay: msg.sender === "ai" ? 0.55 : 0.35,
                      type: "easeInOut",
                      duration: 0.2,
                      scale: { delay: 0, type: "ease" },
                    }}
                  >
                    <div className="bubble">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                    <div
                      className={`actions ${
                        msg.sender === "ai" ? "ai" : "user"
                      } ${msg.id === latestAIId ? "always-show" : ""}`}
                      initial={
                        msg.id === latestAIId ? { opacity: 1 } : { opacity: 0 }
                      }
                      animate={
                        msg.id === latestAIId ? { opacity: 1 } : { opacity: 0 }
                      }
                    >
                      {msg.sender === "user" ? (
                        <>
                          <motion.i
                            className="fa fa-copy"
                            title="Copy"
                            onClick={() => handleCopy(msg.text)}
                            style={{ display: "inline-block" }}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05, type: "ease" }}
                            whileHover={{
                              scale: 1.1,
                              transition: { type: "ease", delay: 0 },
                            }}
                            whileTap={{
                              scale: 0.9,
                              transition: { type: "ease", delay: 0 },
                            }}
                          />
                          <motion.i
                            className="fa fa-pencil"
                            title="Edit"
                            onClick={() => handleEdit(msg.text)}
                            style={{ display: "inline-block" }}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, type: "ease" }}
                            whileHover={{
                              scale: 1.1,
                              transition: { type: "ease", delay: 0 },
                            }}
                            whileTap={{
                              scale: 0.9,
                              transition: { type: "ease", delay: 0 },
                            }}
                          />
                        </>
                      ) : (
                        <>
                          {[
                            "copy",
                            "thumbs-up",
                            "thumbs-down",
                            "volume-up",
                            "sync",
                          ].map((icon, id) => (
                            <motion.i
                              key={icon}
                              className={`fa fa-${icon}`}
                              title={icon}
                              onClick={() => {
                                if (icon === "copy") handleCopy(msg.text);
                                if (icon === "thumbs-up") handleThumb(true);
                                if (icon === "thumbs-down") handleThumb(false);
                                if (icon === "volume-up")
                                  handleReadAloud(msg.text);
                                if (icon === "sync") handleRegenerate(msg.id);
                              }}
                              style={{ display: "inline-block" }}
                              initial={{ opacity: 0, scale: 0 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              exit={{
                                opacity: 0,
                                transition: {
                                  delay: 0,
                                  type: "ease",
                                },
                              }}
                              transition={{ delay: 0.25 - 0.05 * id }}
                              whileHover={{
                                scale: 1.1,
                                transition: { type: "ease", delay: 0 },
                              }}
                              whileTap={{
                                scale: 0.9,
                                transition: { type: "ease", delay: 0 },
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}

              {followUpSuggestions.length > 0 && (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ scale: { delay: 0, type: "spring" } }}
                  className="message followup-suggestions"
                >
                  <motion.div
                    className="bubble suggestions-bubble"
                    initial={{ opacity: 0, scale: 0.8, x: 40, y: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    transition={{
                      delay: 0.35,
                      type: "easeInOut",
                      duration: 0.2,
                      scale: { delay: 0, type: "ease" },
                    }}
                  >
                    Here are some follow-up questions you can ask:
                    <div className="followups">
                      {followUpSuggestions.map((q, i) => (
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.1 + 0.1 * i,
                            scale: { delay: 0, type: "ease" },
                          }}
                          viewport={{ once: true }}
                          whileHover={{
                            scale: 1.01,
                            transition: { delay: 0 },
                          }}
                          whileTap={{
                            scale: 0.99,
                            transition: { delay: 0 },
                          }}
                          key={i}
                          className="suggestion-chip"
                          onClick={() => handleSuggestionClick(q)}
                        >
                          {q}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                  <img
                    src={`${process.env.PUBLIC_URL}/user-icon.svg`}
                    alt="You"
                    className="avatar user-avatar-followup"
                  />
                </motion.div>
              )}

              {errorMsg && <div className="error">{errorMsg}</div>}
              <div ref={chatEndRef} />
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, scale: { delay: 0, type: "ease" } }}
            whileHover={{
              scale: 1.01,
              transition: { delay: 0, type: "easeInOut" },
            }}
            whileTap={{ scale: 1, transition: { delay: 0, type: "easeInOut" } }}
            onSubmit={handleSubmit}
            className="input-form glass"
            style={{ position: "relative", background: "#343a40" }}
            disabled={loading}
          >
            {audioPlaying && (
              <div className="audio-playbar">
                <span>
                  {Math.floor(audioCurrent)} / {Math.ceil(audioDuration)} sec
                </span>
                <div className="audio-controls">
                  {audioPaused ? (
                    <motion.i
                      drag="false"
                      className="fa fa-play"
                      title="Play"
                      onClick={handleAudioResume}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ) : (
                    <motion.i
                      drag="false"
                      className="fa fa-pause"
                      title="Pause"
                      onClick={handleAudioPause}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  )}
                  <motion.i
                    drag="false"
                    className="fa fa-stop"
                    title="Stop"
                    onClick={handleAudioStop}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  />
                </div>
              </div>
            )}
            <motion.div
              className="mic-btn-container"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.3}
              dragTransition={{
                bounceStiffness: 250,
                bounceDamping: 15,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <button
                type="button"
                className={`mic-btn ${listening ? "active" : ""}`}
                // onMouseDown={start}
                // onMouseUp={stop}
                // onTouchStart={start}
                // onTouchEnd={stop}
                onClick={() => (listening ? stop() : start())}
                aria-label={listening ? "Click to stop" : "Click to talk"}
                disabled={loading || micDisabled}
              >
                <i className={`fa fa-microphone${listening ? "" : "-slash"}`} />
              </button>
            </motion.div>
            <input
              ref={inputRef}
              type="text"
              value={listening ? interimQuery : query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`${
                loading
                  ? "Generating Response..."
                  : listening
                    ? "Transcribing... Please ask!"
                    : "Ask another question!"
              }`}
              className="query-input"
              disabled={loading}
            />
            <motion.button
              type="button"
              className="send-float-btn"
              animate={{ translateY: "-50%" }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.3}
              dragTransition={{
                bounceStiffness: 250,
                bounceDamping: 15,
              }}
              whileHover={{
                scale: 1.1,
                translateY: "-50%",
                transition: { delay: 0 },
              }}
              whileTap={{
                scale: 0.9,
                translateY: "-50%",
                transition: { delay: 0 },
              }}
              onClick={() => (loading ? stopGenerating() : sendQuery(query))}
            >
              <motion.i
                drag="false"
                className={`fa ${loading ? "fa-stop" : "fa-arrow-up"}`}
              />
            </motion.button>
          </motion.form>
        </>
      )}
    </div>
  );
};

export default AIChatBot;
