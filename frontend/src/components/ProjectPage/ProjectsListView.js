import React, { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import { FaCrown } from "react-icons/fa";
import { zoomIn } from "../../services/variants";
import { styled } from "@stitches/react";
import { fetchProjects } from "../../services/projectService";
import LikeButton from "../SpecialComponents/LikeButton";
import "../../styles/ProjectsListView.css";

function ProjectsListView({
  addTab,
  isBatterySavingOn,
  showFeatured,
  initialProjectLink = null,
}) {
  const parentRef = useRef(null);
  const titleRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [cardStates, setCardStates] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isWide, setIsWide] = useState(
    typeof window !== "undefined" ? window.innerWidth > 768 : true,
  );

  // Create an array of refs for each project card
  const cardRefs = useRef([]);

  // Debug: topmost visible card (Intersection Observer). Also drives unmount: index <= (visibleCardIndex - 2) → unmount content.
  const [visibleCardIndex, setVisibleCardIndex] = useState(null);
  const DEFAULT_SHELL_MIN_HEIGHT = 320;
  const [cardHeights, setCardHeights] = useState([]); // per-card height when content mounted; shell uses this as minHeight
  const [layoutTrigger, setLayoutTrigger] = useState(0);

  // Throttle hover position updates to one per frame (rAF)
  const pendingMouseRef = useRef(null);
  const hoverRafIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hoverRafIdRef.current !== null) {
        cancelAnimationFrame(hoverRafIdRef.current);
        hoverRafIdRef.current = null;
      }
    };
  }, []);

  // Intersection Observer: topmost visible card. Require 3 consecutive same readings before update to remove flicker at 4→5 and 5→6.
  const lastTopmostRef = useRef(null);
  const stableCountRef = useRef(0);
  const VISIBLE_THRESHOLD = 0.01;
  const STABLE_REQUIRED = 3;
  useEffect(() => {
    if (projects.length === 0) return;
    const ratios = new Array(projects.length).fill(0);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(
            entry.target.getAttribute("data-card-index"),
            10,
          );
          if (!Number.isNaN(index) && index >= 0 && index < projects.length) {
            ratios[index] = entry.intersectionRatio;
          }
        });
        let topmost = -1;
        for (let i = ratios.length - 1; i >= 0; i--) {
          if (ratios[i] >= VISIBLE_THRESHOLD) {
            topmost = i;
            break;
          }
        }
        if (topmost === -1) {
          topmost = ratios.reduce(
            (best, r, i) => (r > ratios[best] ? i : best),
            0,
          );
        }
        if (lastTopmostRef.current === null) {
          lastTopmostRef.current = topmost;
          stableCountRef.current = 1;
          setVisibleCardIndex(topmost);
          return;
        }
        if (lastTopmostRef.current === topmost) {
          stableCountRef.current += 1;
        } else {
          lastTopmostRef.current = topmost;
          stableCountRef.current = 1;
        }
        if (stableCountRef.current >= STABLE_REQUIRED) {
          setVisibleCardIndex(topmost);
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: [
          0, 0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
        ],
      },
    );
    const rafId = requestAnimationFrame(() => {
      for (let i = 0; i < projects.length; i++) {
        const el = cardRefs.current[i];
        if (el) {
          el.setAttribute("data-card-index", String(i));
          observer.observe(el);
        }
      }
    });
    return () => {
      cancelAnimationFrame(rafId);
      for (let i = 0; i < projects.length; i++) {
        const el = cardRefs.current[i];
        if (el) observer.unobserve(el);
      }
    };
  }, [projects.length]);

  // Measure each card's height once (with full content) so shells keep same height when unmounted — no flicker
  useEffect(() => {
    if (projects.length === 0) return;
    const t = requestAnimationFrame(() => {
      const heights = [];
      for (let i = 0; i < projects.length; i++) {
        const el = cardRefs.current[i];
        const h = el?.offsetHeight;
        heights.push(
          typeof h === "number" && h > 0 ? h : DEFAULT_SHELL_MIN_HEIGHT,
        );
      }
      if (heights.length > 0) setCardHeights(heights);
    });
    return () => cancelAnimationFrame(t);
  }, [projects.length, layoutTrigger]);

  // Layout states
  const [baseTopOffset, setBaseTopOffset] = useState(0);
  const [offsetSpacing, setOffsetSpacing] = useState(0);
  const [lastCardMargin, setLastCardMargin] = useState(20);

  // Fetch projects once (or when showFeatured changes).
  useEffect(() => {
    async function getProjects() {
      try {
        const data = await fetchProjects();
        setProjects(data.reverse());
        // Initialize card states for hover effects
        setCardStates(
          data.map(() => ({
            mousePosition: { x: 0, y: 0 },
            isHovering: false,
          })),
        );
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    }
    getProjects();
  }, [showFeatured]);

  // Single debounced resize: updates layoutTrigger, zoom (scale), and isWide. No behavior change.
  const RESIZE_DEBOUNCE_MS = 150;
  useEffect(() => {
    let debounceTimer = null;

    const updateScale = () => {
      const containerEl = parentRef.current;
      const titleEl = titleRef.current;
      if (!containerEl || !titleEl) return;
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      let scaleValue = 1;
      if (screenHeight < 700 && screenWidth > 576) {
        scaleValue = screenHeight / 700;
      }
      containerEl.style.zoom = `${scaleValue}`;
      titleEl.style.zoom = `${scaleValue}`;
    };

    let mounted = true;
    const handleResize = () => {
      if (!mounted) return;
      setIsWide(window.innerWidth > 768);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        if (!mounted) return;
        setLayoutTrigger((prev) => prev + 1);
        updateScale();
      }, RESIZE_DEBOUNCE_MS);
    };

    updateScale();
    window.addEventListener("resize", handleResize);
    return () => {
      mounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Sticky header: run only after user stops scrolling (debounce) so scroll stays smooth.
  // Uses refs instead of querySelector; behavior unchanged.
  useEffect(() => {
    const runStickyLogic = () => {
      const header = titleRef.current;
      const lastCard = parentRef.current?.lastElementChild;
      if (!header || !lastCard) return;
      const titleStyles = window.getComputedStyle(header);
      const titleMarginTop = parseFloat(titleStyles.marginTop) || 0;
      const lastRect = lastCard.getBoundingClientRect();
      const newPosition = lastRect.top <= 0 ? "relative" : "sticky";
      const newTop = lastRect.top <= 0 ? "" : `${titleMarginTop + 52}px`;
      header.style.position = newPosition;
      if (newTop) header.style.top = newTop;
    };

    window.addEventListener("scroll", runStickyLogic, { passive: true });
    runStickyLogic(); // initial state when projects section is in view
    return () => window.removeEventListener("scroll", runStickyLogic);
  }, []);

  // Recalculate layout whenever projects, battery mode, or layoutTrigger changes. Uses refs; runs in rAF to avoid blocking.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    if (projects.length === 0 || !parentRef.current) return;
    const rafId = requestAnimationFrame(() => {
      if (!mountedRef.current) return;
      const containerEl = parentRef.current;
      const titleEl = titleRef.current;
      if (!containerEl) return;

      // 1) .project-section-title margins & height
      let titleHeight = 0,
        titleMarginTop = 0,
        titleMarginBottom = 0;
      if (titleEl) {
        const titleStyles = window.getComputedStyle(titleEl);
        titleHeight = titleEl.getBoundingClientRect().height || 0;
        titleMarginTop = parseFloat(titleStyles.marginTop) || 0;
        titleMarginBottom = parseFloat(titleStyles.marginBottom) || 0;
      }

      // 2) .project-container margin-top
      const containerStyles = window.getComputedStyle(containerEl);
      const containerMarginTop = parseFloat(containerStyles.marginTop) || 0;

      // 3) total available vertical space
      const availableHeight =
        window.innerHeight -
        52 -
        titleHeight -
        titleMarginTop -
        titleMarginBottom -
        containerMarginTop -
        lastCardMargin;

      // 4) initial top offset
      const baseOffset =
        52 +
        titleHeight +
        titleMarginTop +
        titleMarginBottom +
        containerMarginTop;

      // 5) measure last card height
      let hLast = 0;
      const lastChild = containerEl.lastElementChild;
      if (lastChild) {
        hLast = lastChild.getBoundingClientRect().height || 0;
      }

      // 6) compute spacing
      let spacing = 0;
      if (projects.length > 1) {
        spacing = (availableHeight - hLast) / (projects.length - 1);
        if (spacing < 0) spacing = 0;
      }

      // 7) set container padding-bottom
      containerEl.style.paddingBottom = `${
        baseOffset - titleHeight - titleMarginBottom - containerMarginTop
      }px`;
      if (titleEl) {
        // If you want the title to stay above stacked cards, you can manipulate it here
        titleEl.style.top = `${52 + 2 * titleMarginTop}px`; // optional
      }

      if (!mountedRef.current) return;
      setBaseTopOffset(baseOffset);
      setOffsetSpacing(spacing);
      setLastCardMargin(0); // last card margin bottom is 0
    });
    return () => cancelAnimationFrame(rafId);
  }, [projects, isBatterySavingOn, layoutTrigger, lastCardMargin]);

  // Best implementation: dynamically calculate and scroll to the target card using refs.
  const scrollToCard = (index) => {
    if (!parentRef.current) return;

    // Get the combined height of sections above the projects.
    const getSectionHeight = (id) => {
      const el = document.getElementById(id);
      return el ? el.getBoundingClientRect().height : 0;
    };
    const homeHeight = getSectionHeight("home");
    const aboutHeight = getSectionHeight("about");
    const skillsHeight = getSectionHeight("skills");
    const aboveSectionsHeight = homeHeight + aboutHeight + skillsHeight - 52;

    // Get the absolute top of the project container relative to the page.
    // const containerOffsetY =
    //   parentRef.current.getBoundingClientRect().top + window.scrollY;

    // Use a representative card height from the first card.
    const cardHeight =
      cardRefs.current[0] && cardRefs.current[0].getBoundingClientRect().height
        ? cardRefs.current[0].getBoundingClientRect().height
        : 0;

    // Calculate the card's relative Y position within the project container.
    const cardRelativeY = index === 0 ? 0 : -20 + index * cardHeight;

    // Calculate the target scroll position:
    // Sum the heights of sections above projects, the container's offset,
    // plus the card's relative position.
    const targetY =
      aboveSectionsHeight + cardRelativeY - (index / projects.length) * 100;

    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  // Hover effects: position updates throttled to one per frame (rAF); Enter/Leave stay instant for tooltip and pop.
  const flushPendingMouse = () => {
    hoverRafIdRef.current = null;
    const pending = pendingMouseRef.current;
    if (pending === null) return;
    pendingMouseRef.current = null;
    const { index, x, y } = pending;
    setCardStates((prevStates) =>
      prevStates.map((state, i) =>
        i === index ? { ...state, mousePosition: { x, y } } : state,
      ),
    );
  };

  const handleMouseMove = (event, index) => {
    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (clientX - (rect.left + rect.width / 2)) / 30;
    const y = (clientY - (rect.top + rect.height / 2)) / 30;
    pendingMouseRef.current = { index, x, y };
    if (hoverRafIdRef.current === null) {
      hoverRafIdRef.current = requestAnimationFrame(flushPendingMouse);
    }
  };

  const handleMouseEnter = (index) => {
    setHoveredCard(index);
    setCardStates((prevStates) =>
      prevStates.map((state, i) =>
        i === index ? { ...state, isHovering: true } : state,
      ),
    );
  };

  const handleMouseLeave = (index) => {
    setHoveredCard(null);
    setCardStates((prevStates) =>
      prevStates.map((state, i) =>
        i === index ? { ...state, isHovering: false } : state,
      ),
    );
  };

  return (
    <>
      {/* Debug: top-visible card index (Intersection Observer) — top-right under navbar */}
      {/* <div
        style={{
          position: "fixed",
          top: 52,
          right: 16,
          zIndex: 9999,
          padding: "6px 12px",
          background: "rgba(33, 37, 41, 0.95)",
          color: "#edeeef",
          borderRadius: 8,
          fontSize: 14,
          fontFamily: "monospace",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
        aria-hidden="true"
      >
        Card: {visibleCardIndex !== null ? visibleCardIndex : "—"}
      </div> */}
      <h2 ref={titleRef} className="project-section-title">
        My Projects
      </h2>
      <div ref={parentRef} className="project-container">
        {projects.map((project, index) => {
          const { mousePosition, isHovering } = cardStates[index] || {
            mousePosition: { x: 0, y: 0 },
            isHovering: false,
          };

          // Nothing unmounts until topmost reaches 5. Then window of 5: topmost−2 .. topmost+2 (e.g. 5 → 3,4,5,6,7). Before that, 0 through topmost+2.
          const hasContentMounted =
            visibleCardIndex === null
              ? index < 3
              : visibleCardIndex < 5
                ? index <= visibleCardIndex + 2
                : index >= visibleCardIndex - 2 &&
                  index <= visibleCardIndex + 2;

          const topOffset = baseTopOffset + index * offsetSpacing;
          const baseStyle = {
            top: `${topOffset}px`,
            marginBottom:
              index === projects.length - 1 ? `${lastCardMargin}px` : "0px",
            ...(!hasContentMounted && {
              minHeight: cardHeights[index] ?? DEFAULT_SHELL_MIN_HEIGHT,
            }),
          };

          return (
            <motion.div
              key={`project-${project.projectTitle}-${index}`}
              ref={(el) => (cardRefs.current[index] = el)}
              data-card-index={index}
              className={
                (index === projects.length - 1
                  ? "project-card  project-card-last"
                  : "project-card") +
                (initialProjectLink &&
                (project.projectLink || "").toLowerCase() ===
                  (initialProjectLink || "").toLowerCase()
                  ? " project-card-initial-active"
                  : "")
              }
              // initial={{ opacity: 0 }}
              // animate={{ opacity: 1 }}
              // exit={{ opacity: 0 }}
              // transition={{ delay: 0, type: "spring" }}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
              onClick={() => scrollToCard(index)}
              style={{
                ...baseStyle,
                transform: isBatterySavingOn
                  ? ""
                  : isHovering
                    ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0)`
                    : "translate3d(0, 0, 0)",
                transition: isBatterySavingOn
                  ? "none"
                  : "transform 0.1s ease-out",
              }}
            >
              {hoveredCard === index && (
                <div className="hover-tooltip">{project.projectTitle}</div>
              )}
              {/* Like Button positioned at the top-right corner */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  zIndex: 100,
                }}
              >
                <LikeButton
                  type="Project"
                  title={project.projectTitle}
                  onLikeSuccess={() =>
                    setProjects((prevProjects) =>
                      prevProjects.map((p) =>
                        p.projectTitle === project.projectTitle
                          ? { ...p, likesCount: (p.likesCount || 0) + 1 }
                          : p,
                      ),
                    )
                  }
                />
              </div>
              {hasContentMounted ? (
                <div
                  className="card-content"
                  style={{
                    height: "fit-content",
                    transform: isHovering
                      ? `translate3d(${-mousePosition.x}px, ${-mousePosition.y}px, 0)`
                      : "translate3d(0,0,0)",
                    transition: isBatterySavingOn
                      ? "none"
                      : "transform 0.1s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isWide ? "row" : "column-reverse",
                    }}
                  >
                    <div className="project-info" id={project.projectLink}>
                      <div className="project-header">
                        {project.projectSubTitle &&
                          project.projectSubTitle !== "NA" && (
                            <span>{project.projectSubTitle}</span>
                          )}
                        {project.projectTimeline &&
                          project.projectTimeline !== "NA" && (
                            <span> | {project.projectTimeline}</span>
                          )}
                      </div>
                      <a
                        className="project-title"
                        href={`#${project.projectLink}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToCard(index);
                        }}
                      >
                        {project.projectTitle}
                      </a>
                      <hr />
                      {project.projectTagline &&
                        project.projectTagline !== "NA" && (
                          <p className="project-tagline">
                            {project.projectTagline}
                          </p>
                        )}

                      <motion.div
                        className="learn-button-motioned"
                        onClick={() => addTab("Project", project)}
                        variants={zoomIn(1)}
                        initial="hidden"
                        animate="show"
                        drag
                        dragConstraints={{
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                        }}
                        dragElastic={0.3}
                        dragTransition={{
                          bounceStiffness: 250,
                          bounceDamping: 15,
                        }}
                      >
                        <StyledButton onClick={(e) => e.preventDefault()}>
                          <ButtonShadow />
                          <ButtonEdge />
                          <ButtonLabel>Learn More →</ButtonLabel>
                        </StyledButton>
                      </motion.div>
                    </div>

                    <div
                      className="project-image"
                      style={{
                        backgroundImage: `url(${project.projectImages[0]})`,
                      }}
                    ></div>
                  </div>

                  {/* Like Count displayed at bottom-right if likesCount > 0 */}
                  {project.likesCount > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "5px",
                        right: "10px",
                        color: "#edeeef",
                        fontSize: "0.8em",
                        zIndex: 150,
                      }}
                    >
                      Likes: {project.likesCount}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="card-content"
                  style={{
                    height: "fit-content",
                    transform: isHovering
                      ? `translate3d(${-mousePosition.x}px, ${-mousePosition.y}px, 0)`
                      : "translate3d(0,0,0)",
                    transition: isBatterySavingOn
                      ? "none"
                      : "transform 0.1s ease-out",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

export default memo(ProjectsListView);

/* -------------------------------------------------------
   Styled Components for the "Learn More →" Button 
   (unchanged from your original code)
---------------------------------------------------------*/
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
  fontSize: "14px",
  display: "block",
  position: "relative",
  borderRadius: 5,
  color: "#212529",
  padding: "1rem 1.5rem",
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
  width: "fit-content",
  cursor: "pointer",
  background: "transparent",
  position: "relative",
  padding: 0,
  transition: "filter 250ms ease-out",
  "&:hover": {
    filter: "brightness(110%)",
    [`& ${ButtonLabel}`]: { transform: "translateY(-8px)" },
    [`& ${ButtonShadow}`]: { transform: "translateY(6px)" },
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
