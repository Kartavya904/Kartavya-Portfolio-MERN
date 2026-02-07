import React, { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import { FaCrown } from "react-icons/fa";
import { zoomIn } from "../../services/variants";
import { styled } from "@stitches/react";
import { fetchProjects } from "../../services/projectService";
import LikeButton from "../SpecialComponents/LikeButton";
import "../../styles/ProjectsListView.css";

function ProjectsListView({ addTab, isBatterySavingOn, showFeatured }) {
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

  // Trigger to force layout recalculation
  const [layoutTrigger, setLayoutTrigger] = useState(0);

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

    const handleResize = () => {
      setIsWide(window.innerWidth > 768);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        setLayoutTrigger((prev) => prev + 1);
        updateScale();
      }, RESIZE_DEBOUNCE_MS);
    };

    updateScale();
    window.addEventListener("resize", handleResize);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Sticky header: run only after user stops scrolling (debounce) so scroll stays smooth.
  // Uses refs instead of querySelector; behavior unchanged.
  useEffect(() => {
    let debounceTimer = null;
    const STICKY_DEBOUNCE_MS = 120;

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

    const handleScroll = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        runStickyLogic();
      }, STICKY_DEBOUNCE_MS);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    runStickyLogic(); // initial state when projects section is in view
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("scroll", handleScroll);
    };
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
      <h2 ref={titleRef} className="project-section-title">
        My Projects
      </h2>
      <div ref={parentRef} className="project-container">
        {projects.map((project, index) => {
          const { mousePosition, isHovering } = cardStates[index] || {
            mousePosition: { x: 0, y: 0 },
            isHovering: false,
          };

          // Each card's top offset
          const topOffset = baseTopOffset + index * offsetSpacing;

          return (
            <motion.div
              key={`project-${project.projectTitle}-${index}`}
              ref={(el) => (cardRefs.current[index] = el)}
              className={
                index === projects.length - 1
                  ? "project-card  project-card-last"
                  : "project-card"
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
                top: `${topOffset}px`,
                marginBottom:
                  index === projects.length - 1 ? `${lastCardMargin}px` : "0px",
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
                {/* {project.featured && <FaCrown className="featured-tag" />} */}

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
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
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
