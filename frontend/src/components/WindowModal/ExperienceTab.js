import React from "react";
import { motion } from "framer-motion";
import "../../styles/ProjectTab.css";
import github from "../../assets/img/icons/github.png";
import youtube from "../../assets/img/icons/youtube.png";
import devpost from "../../assets/img/icons/devpost.png";
import web from "../../assets/img/icons/web.png";
import ImagesCarousel from "./ImageCarousel"; // Import ImageCarousel component

const ExperienceTab = ({ data }) => {
  const renderLogos = (urls) => {
    if (!urls) return null; // Check if URLs exist

    return Object.entries(urls).map(([key, value]) => {
      const iconName = getIconForLink(value);
      return (
        <motion.a
          key={key}
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: 360 }}
          transition={{
            delay: 1.7 + 0.4 * key,
            type: "ease",
          }}
          viewport={{ once: true }}
        >
          <motion.img
            src={`${iconName}`}
            alt={`${iconName} logo`}
            className="project-window-logo"
            whileHover={{
              scale: 1.01,
              rotate: 360,
            }}
            whileTap={{
              scale: 0.99,
              rotate: 0,
            }}
            transition={{
              type: "ease",
            }}
          />
        </motion.a>
      );
    });
  };

  const getIconForLink = (link) => {
    if (link.includes("github")) return github;
    if (link.includes("youtube") || link.includes("youtu")) return youtube;
    if (link.includes("devpost")) return devpost;
    return web;
  };

  return (
    <>
      <motion.div className="project-window-tab-container">
        {/* Images Section */}
        {data.experienceImages && (
          <div className="project-image-container">
            <ImagesCarousel
              data={data.experienceImages} // Repeat images 9 times
              title={data.experienceTitle || "Experience"}
            />
          </div>
        )}

        <motion.div
          className="project-window-content"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "ease" }}
        >
          {data.experienceTitle && (
            <motion.h2
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: "ease" }}
              viewport={{ once: true }}
            >
              {data.experienceTitle}
            </motion.h2>
          )}

          {data.experienceSubTitle && (
            <motion.h3
              className="project-window-subtitle"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: "ease" }}
              viewport={{ once: true }}
            >
              {data.experienceSubTitle}
            </motion.h3>
          )}

          {data.experienceTimeline && (
            <motion.h4
              className="project-window-timeline"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 1.1, type: "ease" }}
              viewport={{ once: true }}
            >
              {data.experienceTimeline}
            </motion.h4>
          )}

          {data.experienceTagline && (
            <motion.h4
              className="project-window-tagline"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              // drag
              // dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              // dragElastic={0.3}
              // dragTransition={{
              //   bounceStiffness: 250,
              //   bounceDamping: 15,
              // }}
              whileHover={{ scale: 1.01 }}
              whileTap={{
                scale: 0.98,
                boxsizing: "border-box",
                outline: "1px solid limegreen !important",
              }}
              transition={{ delay: 1.3, type: "ease" }}
              viewport={{ once: true }}
            >
              {data.experienceTagline}
            </motion.h4>
          )}

          {data.experienceURLs.length > 0 && (
            <motion.div
              className="project-window-urls"
              initial={{ opacity: 0, scale: 0 }}
              // drag
              // dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              // dragElastic={0.3}
              // dragTransition={{
              //   bounceStiffness: 250,
              //   bounceDamping: 15,
              // }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: 1.5, type: "ease" }}
              viewport={{ once: true }}
            >
              {renderLogos(data.experienceURLs)}
            </motion.div>
          )}

          {data.experienceParagraphs &&
            data.experienceParagraphs.length > 0 && (
              <motion.div
                className="project-window-paragraphs glass"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2, type: "ease" }}
                viewport={{ once: true }}
              >
                {data.experienceParagraphs.map((para, index) => (
                  <motion.p
                    key={index}
                    className="project-window-paragraph"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0, type: "ease" }}
                    viewport={{ once: true }}
                  >
                    {para}
                  </motion.p>
                ))}
              </motion.div>
            )}
        </motion.div>
      </motion.div>
    </>
  );
};

export default ExperienceTab;
