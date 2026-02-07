import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { zoomIn } from "../../services/variants";
import Background from "./Background";
import InvolvementTabPage from "./InvolvementTabPage";
import CareerTabPage from "./CareerTabPage";
import HonorsTabPage from "./HonorsTabPage";
import "../../styles/ExperiencePage.css";

const tabs = [
  {
    title: "Involvement",
    icon: <i className="tab-icon fa-solid fa-handshake" />,
    component: InvolvementTabPage,
  },
  {
    title: "Career",
    icon: <i className="tab-icon fa-solid fa-briefcase" />,
    component: CareerTabPage,
  },
  {
    title: "Honors",
    icon: <i className="tab-icon fa-solid fa-trophy" />,
    component: HonorsTabPage,
  },
];

const scrollToSection = (id) => {
  const element = document.getElementById(id);
  const offset = 52; // Adjust based on your navbar height
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.scrollY - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
};

const tabHighlightVariants = {
  initial: (currentIndex) => ({
    x: `${currentIndex * 12}px`,
    width: 0,
    opacity: 0,
    scale: 0,
    transition: { duration: 0.3 },
  }),
  animate: (targetIndex) => ({
    x: `${targetIndex * 120}px`,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 40,
      duration: 0.3,
    },
  }),
};

const ExperiencePage = ({
  addTab,
  isBatterySavingOn,
  isWindowModalVisible,
}) => {
  const [selectedTab, setSelectedTab] = useState(tabs[1]); // Default tab is "Career"
  const [ActiveComponent, setActiveComponent] = useState(
    () => selectedTab.component,
  );

  useEffect(() => {
    const updateScale = () => {
      const tabsWrapper = document.querySelector(".tabs-wrapper");
      const slideContainer = document.querySelector(".content-container");
      if (!tabsWrapper || !slideContainer) return;
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      let scaleValue = 1;
      if (screenHeight < 826 && screenWidth > 576) {
        scaleValue = screenHeight / 826;
      }
      tabsWrapper.style.scale = `${scaleValue}`;
      slideContainer.style.zoom = `${scaleValue}`;
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <>
      <AnimatePresence>
        <section className="experience-container" id="experience">
          {/* <Background /> */}
          <motion.div
            className="experience-div"
            variants={isBatterySavingOn ? {} : zoomIn(0)}
            initial="show"
            whileInView="show"
            exit="hidden"
            style={
              isWindowModalVisible
                ? { opacity: 0, transition: "opacity 0.5s ease-in-out" }
                : { opacity: 1, transition: "opacity 0.5s ease-in-out" }
            }
          >
            <motion.div
              className="tabs-wrapper"
              variants={isBatterySavingOn ? {} : zoomIn(0)}
              initial="hidden"
              whileInView="show"
              exit="hidden"
              viewport={{ once: true }}
            >
              <motion.div
                className="tab-highlight"
                key={`tab-${selectedTab}`}
                custom={tabs.indexOf(selectedTab)}
                // variants={tabHighlightVariants}
                // animate="animate"
                // initial="initial"
              />
              {tabs.map((tab) => (
                <motion.button
                  key={tab.title}
                  className={`tab-button${
                    selectedTab.title === tab.title ? " active" : ""
                  }`}
                  onClick={() => {
                    setSelectedTab(tab);
                    setActiveComponent(() => tab.component);
                    scrollToSection("experience");
                  }}
                  whileInView={
                    isBatterySavingOn ? {} : { opacity: 1, scale: 1 }
                  }
                  whileHover={isBatterySavingOn ? {} : { scale: 1.1 }}
                  whileTap={isBatterySavingOn ? {} : { scale: 0.9 }}
                  transition={
                    isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                  }
                  aria-label={tab.title}
                >
                  {tab.icon}
                  {selectedTab.title === tab.title ? (
                    <span className="tab-text">{tab.title}</span>
                  ) : (
                    ""
                  )}
                </motion.button>
              ))}
            </motion.div>
            <motion.div
              className="content-container"
              variants={isBatterySavingOn ? {} : zoomIn(0)}
              initial="hidden"
              animate="show"
              exit="hidden"
              viewport={{ once: true }}
            >
              <ActiveComponent
                addTab={addTab}
                isBatterySavingOn={isBatterySavingOn}
              />
            </motion.div>
          </motion.div>
        </section>
      </AnimatePresence>
    </>
  );
};

export default ExperiencePage;
