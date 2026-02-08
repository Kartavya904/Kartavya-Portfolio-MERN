import React, { useState, useEffect, useRef, memo } from "react";
import { useSpeechInput } from "../../hooks/useSpeechInput";
import { styled } from "@stitches/react";
import { TypeAnimation } from "react-type-animation";
// import { Parallax } from "react-parallax";
import { useSpring, animated } from "@react-spring/web";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  delay,
} from "framer-motion";
import { zoomIn } from "../../services/variants";
import "../../styles/HomePage.css";
// import ProfilePhoto from `${process.env.PUBLIC_URL}/Kartavya.webp`;

function HomePage({
  isBatterySavingOn,
  scrolled,
  addTab,
  sendQuery,
  isLoadingComplete,
}) {
  const [clicked, setClicked] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const clickCount = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const [key, setKey] = useState(0); // State to reset the animation on click
  const [frameIndex, setFrameIndex] = useState(0); // Track current frame index
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const frames = ["", " frame1", " frame2", " frame3"]; // Define frame styles
  const HomeBGRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: HomeBGRef,
    offset: ["start start", "end start"],
    axis: "y",
    smooth: true,
  });
  const blur = useTransform(scrollYProgress, [0, 1], [1, 20]);
  const currentBlur = blur.current !== undefined ? blur.current : 0;
  const appliedBlur = scrolled && currentBlur > 0.3 ? currentBlur : 0;
  const scale = useTransform(scrollYProgress, [0, 0.1, 1], [1.01, 1.01, 1.6]);
  // const opacity = useTransform(scrollYProgress, [0.25, 1], [1, 1]);

  const handleProfileClick = () => {
    setFrameIndex((prevIndex) => (prevIndex + 1) % frames.length); // Cycle frames
  };

  const keywords = [
    "Developing with Curiosity and Expertise | Always Learning & Innovating",
    "Innovating AI-Powered Solutions | Experienced Full Stack Developer",
  ];

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
      clickCount.current = 0; // Reset click count after reaching the limit

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

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    const offset = 52; // Adjust based on your navbar height
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
      duration: 10000,
    });
  };

  // Chat‐input state & speech hook:
  const [query, setQuery] = useState("");
  const [interimQuery, setInterimQuery] = useState("");
  const { listening, supported, permission, start, stop } = useSpeechInput({
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        setQuery((q) => q + " " + transcript);
        setInterimQuery("");
      } else {
        setInterimQuery(transcript);
      }
    },
  });
  const micDisabled = !supported || permission === "denied";
  const inputRef = useRef(null);

  const handleHomeSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    // open the AIChatTab and pass the initialQuery in its data
    addTab("AIChatTab", {
      title: "Kartavya's AI Companion",
    });
    sendQuery(trimmed);
    // setQuery(trimmed);
    setQuery("");
    setInterimQuery("");
  };

  useEffect(() => {
    const updateScale = () => {
      const homeRow = document.querySelector(".home-row");
      const infoRow = document.querySelector(".info");
      if (!homeRow || !infoRow) return;
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      let scaleValue = 1;
      if (screenHeight < 826 && screenWidth > 576) {
        scaleValue = screenHeight / 826;
      }
      homeRow.style.zoom = `${scaleValue}`;
      infoRow.style.zoom = `${scaleValue}`;
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <AnimatePresence>
      <div key="home-bg" className="homepage-bg-wrapper" ref={HomeBGRef}>
        <motion.div
          className="homepage-bg"
          style={
            isBatterySavingOn
              ? {
                  background: `linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.4),
                rgba(0, 0, 0, 0.35),
                rgba(0, 0, 0, 0.3),
                rgba(0, 0, 0, 0.25),
                rgba(0, 0, 0, 0.2),
                rgba(0, 0, 0, 0.25),
                rgba(0, 0, 0, 0.1),
                rgba(0, 0, 0, 0.1)
              ), url('${process.env.PUBLIC_URL}/home-bg.webp'))`,
                  backgroundRepeat: "no-repeat",
                  backgroundAttachment: "fixed",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : {
                  background: `linear-gradient(
                  to bottom,
                  rgba(0, 0, 0, 0.4),
                  rgba(0, 0, 0, 0.35),
                  rgba(0, 0, 0, 0.3),
                  rgba(0, 0, 0, 0.25),
                  rgba(0, 0, 0, 0.2),
                  rgba(0, 0, 0, 0.25),
                  rgba(0, 0, 0, 0.1),
                  rgba(0, 0, 0, 0.1)
                ), url('${process.env.PUBLIC_URL}/home-bg.webp')`,
                  backgroundRepeat: "no-repeat",
                  backgroundAttachment: "fixed",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  // opacity,
                  scale,
                  filter: `blur(${appliedBlur}px)`,
                  transformOrigin: "top top",
                  zIndex: 0,
                  willChange: "transform, filter",
                  transform: "translateZ(0)",
                }
          }
        />
      </div>
      <section key="home-content" className="homepage-container" id="home">
        <div
          className="container"
          // style={{ zoom: "80%", height: "calc(100vh -52px)" }}
        >
          <div className="home-div">
            <div className="home-row" style={{ zIndex: 100000 }}>
              <motion.div
                className={`profile-picture-container`}
                variants={isBatterySavingOn ? {} : zoomIn(0)}
                initial="hidden"
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.3}
                dragTransition={{
                  bounceStiffness: 250,
                  bounceDamping: 15,
                }}
                transition={{ scale: { delay: 0, type: "spring" } }}
                whileTap={isBatterySavingOn ? {} : { scale: 1.1 }}
                whileInView={"show"}
              >
                <animated.img
                  src={`${process.env.PUBLIC_URL}/Kartavya.webp`}
                  alt="Profile"
                  className={`profile-picture img-circle${frames[frameIndex]}`}
                  draggable="false"
                  style={{
                    boxShadow,
                    transform: isBatterySavingOn
                      ? {}
                      : isHovering
                        ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) scale3d(1.03, 1.03, 1.03)`
                        : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
                    transition: "transform 0.1s ease-out",
                    height: "250px !important",
                    width: "250px !important",
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    handleClick();
                    handleProfileClick();
                  }}
                />
              </motion.div>
            </div>
            <div
              className="home-row info"
              style={{ zIndex: 99999, position: "relative" }}
            >
              <motion.h1
                className="name"
                variants={isBatterySavingOn ? {} : zoomIn(0)}
                initial="hidden"
                animate="show"
              >
                Kartavya Singh
              </motion.h1>

              {/* Changing Text Animation: only starts when loading overlay is gone */}
              <motion.div
                className="changing-text-container"
                onClick={() => setKey((prevKey) => prevKey + 1)}
                variants={isBatterySavingOn ? {} : zoomIn(0)}
                initial="hidden"
                animate="show"
              >
                <em>
                  <span className="changing-text">
                    {isLoadingComplete ? (
                      <TypeAnimation
                        key={key} // Forces the component to re-render on click
                        className="changing-text-animation"
                        sequence={[
                          500,
                          ...keywords.map((text) => [text, 3000]), // Typing each keyword with a pause
                          keywords[keywords.length - 1], // Ensures the last phrase displays permanently
                        ].flat()}
                        speed={{ type: "keyStrokeDelayInMs", value: 17 }} // Fast typing
                        deletionSpeed={{ type: "keyStrokeDelayInMs", value: 8 }}
                        // delay={1000}
                        repeat={0} // No repeat
                        cursor={true}
                      />
                    ) : (
                      <span className="changing-text-animation">
                        {keywords[0]}
                      </span>
                    )}
                  </span>
                </em>
              </motion.div>

              <motion.form
                initial={{ opacity: 0, scale: 0 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.3}
                dragTransition={{
                  bounceStiffness: 250,
                  bounceDamping: 15,
                }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0, scale: { delay: 0, type: "ease" } }}
                whileHover={{
                  scale: 1.01,
                  transition: { delay: 0, type: "easeInOut" },
                }}
                whileTap={{
                  scale: 1,
                  transition: { delay: 0, type: "easeInOut" },
                }}
                onSubmit={handleHomeSubmit}
                className="home-input-form glass"
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
                  <button
                    type="button"
                    className={`mic-btn glass ${listening ? "active" : ""}`}
                    // onMouseDown={start}
                    // onMouseUp={stop}
                    // onTouchStart={start}
                    // onTouchEnd={stop}
                    onClick={(e) => {
                      e.preventDefault();
                      addTab("AIChatTab", { title: "Kartavya's AI Companion" });
                    }}
                    aria-label={"Open AI Companion Tab"}
                  >
                    <i className={`fas fa-expand`} />
                  </button>
                </motion.div>
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
                    disabled={micDisabled}
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
                    listening ? "Transcribing..." : "Ask My AI Companion!"
                  }`}
                  onKeyDown={(e) => {
                    // Enter=send, Shift+Enter=newline
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleHomeSubmit(e);
                    }
                  }}
                  className="query-input"
                />
                <motion.button
                  type="submit"
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
                >
                  <motion.i drag="false" className={`fa fa-arrow-up`} />
                </motion.button>
              </motion.form>

              {/* Styled "Enter Portfolio" Button */}
              <motion.div
                className="enter-button-motioned"
                variants={isBatterySavingOn ? {} : zoomIn(0)}
                initial="hidden"
                animate="show"
                whileHover={{
                  scale: 1.05,
                  transition: { scale: { delay: 0, type: "spring" } },
                }}
                whileTap={{
                  scale: 1,
                  transition: { scale: { delay: 0, type: "spring" } },
                }}
                // drag="false"
                // dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                // dragElastic={0.3}
                // dragTransition={{
                //   bounceStiffness: 250,
                //   bounceDamping: 15,
                // }}
              >
                <StyledButton
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("about");
                  }}
                >
                  <ButtonShadow />
                  <ButtonEdge />
                  <ButtonLabel>Enter Portfolio</ButtonLabel>
                </StyledButton>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </AnimatePresence>
  );
}

export default memo(HomePage);

// Styled Components for Button
const ButtonPart = styled("span", {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  borderRadius: 8,
});

const ButtonShadow = styled(ButtonPart, {
  background: "hsl(0deg 0% 0% / 0.1)",
  transform: "translateY(2px)",
  transition: "transform 250ms ease-out",
});

const ButtonEdge = styled(ButtonPart, {
  background: `linear-gradient(
      to left,
      hsl(0deg 0% 69%) 0%,
      hsl(0deg 0% 85%) 8%,
      hsl(0deg 0% 85%) 92%,
      hsl(0deg 0% 69%) 100%
    )`,
});

const ButtonLabel = styled("span", {
  fontFamily: "Montserrat",
  fontSize: "18px",
  display: "block",
  position: "relative",
  borderRadius: 5,
  color: "#212529",
  padding: "1rem 2rem",
  background: "#f8f9fa",
  transform: "translateY(-4px)",
  width: "100%",
  userSelect: "none",
  transition:
    "transform 250ms ease-out, background-color 0.3s ease, color 0.3s ease",

  "&:hover": {
    backgroundColor: "#fcbc1d",
    color: "#212529",
    transform: "scale(1.05)",
  },
});

const StyledButton = styled("button", {
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
  background: "transparent",
  position: "relative",
  padding: 0,
  transition: "filter 250ms ease-out",

  "&:hover": {
    filter: "brightness(110%)",

    [`& ${ButtonLabel}`]: {
      transform: "translateY(-8px)",
    },

    [`& ${ButtonShadow}`]: {
      transform: "translateY(6px)",
    },
  },

  "&:active": {
    [`& ${ButtonLabel}`]: {
      transform: "translateY(-2px)",
      transition: "transform 34ms",
    },

    [`& ${ButtonShadow}`]: {
      transform: "translateY(1px)",
      transition: "transform 34ms",
    },
  },
});
