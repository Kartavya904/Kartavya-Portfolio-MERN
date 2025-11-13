import React, { useState, useEffect, memo } from "react";
import { zoomIn, fadeIn } from "../../services/variants";
import "../../styles/SkillPage.css";
import github from "../../assets/img/icons/github.png";
import SkillBG from "./SkillBG.js";
import SkillGraphCarousel from "./SkillGraph";
import SkillSection from "./SkillSection";
import { fetchSkillsComponents } from "../../services/skillComponentService";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { motion, AnimatePresence } from "framer-motion";

// Register necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ topLangs, isBatterySavingOn }) => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Enhanced Data
  const data = {
    labels: topLangs.labels,
    datasets: [
      {
        label: "Hours of Coding",
        data: topLangs.data,
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 2,
        borderRadius: 6, // Rounded bars
      },
    ],
  };

  // Responsive Chart Options
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow dynamic sizing
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        className: "skill-paragraph",
        text: "Coding Hours by Language",
        color: "#edeeef",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#edeeef",
          font: {
            size: 12,
          },
        },
        grid: {
          display: true,
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 450,
        ticks: {
          color: "#edeeef",
          stepSize: 50,
          font: {
            size: 12,
          },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        animation: {
          duration: 5000, // 2 seconds for the animation
          easing: "easeOutQuart", // Smooth easing for the animation
        },
      },
    },
  };

  return (
    <motion.div
      className="bar-chart-container"
      variants={isBatterySavingOn ? {} : zoomIn(0)}
      initial="hidden"
      whileInView="show"
      exit="hidden"
    >
      <Bar
        className="bar-chart"
        key={`bar-chart-${screenWidth}`}
        data={data}
        options={options}
        aria-label="Bar chart displaying coding hours by language"
      />
    </motion.div>
  );
};

function SkillPage({ isBatterySavingOn, isWindowModalVisible }) {
  const [skillScreenWidth, setSkillScreenWidth] = useState(window.innerWidth);
  const [topLangs, setTopLangs] = useState({ labels: [], data: [] });
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const fetchedSkills = await fetchSkillsComponents();
        setSkills(fetchedSkills);
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };

    loadSkills();
  }, []);

  // useEffect(() => {
  //   const fetchTopLangData = async () => {
  //     const totalHours = 1200;
  //     const url = `${process.env.REACT_APP_API_URI}/top-langs`;

  //     try {
  //       const response = await fetch(url);
  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }
  //       const svgData = await response.text();

  //       // Parse the SVG data to extract lang-name innerHTML
  //       const parser = new DOMParser();
  //       const svgDoc = parser.parseFromString(svgData, "image/svg+xml");
  //       const langNames = svgDoc.querySelectorAll(".lang-name");

  //       const extractedLangNames = Array.from(langNames).map((el) =>
  //         el.innerHTML.trim()
  //       );

  //       // Process the first 5 elements to create the topLangs dictionary
  //       let processedData = extractedLangNames.slice(0, 5).reduce(
  //         (acc, lang) => {
  //           const parts = lang.split(" ");
  //           const name = parts.slice(0, -1).join(" "); // All but the last word
  //           const percentage = parseFloat(
  //             parts[parts.length - 1].replace("%", "")
  //           );
  //           // Calculate the hours for this language
  //           const value = percentage * ((totalHours * 0.75) / 100);

  //           acc.labels.push(name);
  //           acc.data.push(parseFloat(value.toFixed(2)));
  //           return acc;
  //         },
  //         { labels: [], data: [] }
  //       );

  //       // Calculate total hours spent on the top languages
  //       const totalTopLangsHours = processedData.data.reduce(
  //         (acc, curr) => acc + curr,
  //         0
  //       );

  //       // Calculate remaining hours and assign them to C++
  //       const remainingHours = parseFloat(
  //         (totalHours - totalTopLangsHours).toFixed(2)
  //       );
  //       const cppIndex = processedData.labels.indexOf("C++");

  //       if (cppIndex !== -1) {
  //         processedData.data[cppIndex] = remainingHours;
  //       } else {
  //         processedData.labels.push("C++");
  //         processedData.data.push(remainingHours);
  //       }

  //       // Sort the processedData by hours in descending order
  //       const sortedIndices = [...processedData.data.keys()].sort(
  //         (a, b) => processedData.data[b] - processedData.data[a]
  //       );

  //       processedData = {
  //         labels: sortedIndices.map((index) => processedData.labels[index]),
  //         data: sortedIndices.map((index) => processedData.data[index]),
  //       };

  //       setTopLangs(processedData);
  //     } catch (error) {
  //       console.error("Error fetching TopLangData:", error);

  //       // Fallback raw percentages, similar to what you'd normally receive from the API.
  //       const fallbackLangs = [
  //         "JavaScript 46.86%",
  //         "HTML 25.11%",
  //         "Python 15.59%",
  //         "CSS 13.45%",
  //       ];

  //       let processedData = fallbackLangs.slice(0, 5).reduce(
  //         (acc, lang) => {
  //           const parts = lang.split(" ");
  //           const name = parts.slice(0, -1).join(" ");
  //           const percentage = parseFloat(
  //             parts[parts.length - 1].replace("%", "")
  //           );
  //           const value = percentage * ((totalHours * 0.75) / 100);
  //           acc.labels.push(name);
  //           acc.data.push(parseFloat(value.toFixed(2)));
  //           return acc;
  //         },
  //         { labels: [], data: [] }
  //       );

  //       // Calculate total hours spent on the fallback languages
  //       const totalTopLangsHours = processedData.data.reduce(
  //         (acc, curr) => acc + curr,
  //         0
  //       );

  //       // Calculate remaining hours and add as C++
  //       const remainingHours = parseFloat(
  //         (totalHours - totalTopLangsHours).toFixed(2)
  //       );
  //       processedData.labels.push("C++");
  //       processedData.data.push(remainingHours);

  //       // Sort the processedData by hours in descending order
  //       const sortedIndices = [...processedData.data.keys()].sort(
  //         (a, b) => processedData.data[b] - processedData.data[a]
  //       );

  //       processedData = {
  //         labels: sortedIndices.map((index) => processedData.labels[index]),
  //         data: sortedIndices.map((index) => processedData.data[index]),
  //       };

  //       setTopLangs(processedData);
  //     }
  //   };

  //   fetchTopLangData();
  // }, []);

  useEffect(() => {
    const fetchTopLangData = async () => {
      const totalHours = 1300;
      const url = `${process.env.REACT_APP_API_URI}/github-stats/top-langs`;

      // Fallback data if fetch fails or returns nothing
      const fallbackLangJson = {
        JavaScript: "33.06%",
        Python: "32.19%",
        HTML: "14.98%",
        "C++": "8.53%",
        CSS: "7.12%",
        "ASP.NET": "4.12%",
      };

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let langJson = await response.json();

        // If the returned JSON is empty, use fallback data
        if (!langJson || Object.keys(langJson).length === 0) {
          langJson = fallbackLangJson;
        }

        // Convert the JSON object to an array of { name, percentage } objects
        const langArray = Object.entries(langJson).map(
          ([name, percentageStr]) => ({
            name,
            percentage: parseFloat(percentageStr.replace("%", "")),
          })
        );

        // Use all languages returned (or you can slice if you only want the top N)
        const topLanguages = langArray;

        // Allocate hours based on the percentage (hours = totalHours * (percentage/100))
        const processedData = topLanguages.reduce(
          (acc, lang) => {
            const hours = totalHours * (lang.percentage / 100);
            acc.labels.push(lang.name);
            acc.data.push(parseFloat(hours.toFixed(2)));
            return acc;
          },
          { labels: [], data: [] }
        );

        setTopLangs(processedData);
      } catch (error) {
        console.error("Error fetching TopLangData:", error);
        // Use fallback data if an error occurs
        const fallbackLangArray = Object.entries(fallbackLangJson).map(
          ([name, percentageStr]) => ({
            name,
            percentage: parseFloat(percentageStr.replace("%", "")),
          })
        );
        const processedData = fallbackLangArray.reduce(
          (acc, lang) => {
            const hours = totalHours * (lang.percentage / 100);
            acc.labels.push(lang.name);
            acc.data.push(parseFloat(hours.toFixed(2)));
            return acc;
          },
          { labels: [], data: [] }
        );
        setTopLangs(processedData);
      }
    };

    fetchTopLangData();
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const skillBox = document.querySelector(".skill-box");
      if (!skillBox) return;
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      let scaleValue = 1;
      if (screenHeight < 826 && screenWidth > 576) {
        scaleValue = screenHeight / 826;
      }
      skillBox.style.zoom = `${scaleValue}`;
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSkillScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section
      className="skill-container"
      id="skills"
      style={{ overflow: "hidden" }}
    >
      {/* <SkillBG /> */}
      {/* <EnhancedHexagonalGrid /> */}
      {/* <SpotlightBG /> */}
      <motion.div
        className="skill-div"
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
        <div className="skill-box">
          <motion.h2
            className="skill-heading"
            variants={isBatterySavingOn ? {} : fadeIn("right", 200, 0)}
            initial="hidden"
            animate="show"
            // exit="hidden"
          >
            Skills
          </motion.h2>
          <motion.div className="skill-section">
            <motion.p
              className="skill-paragraph"
              variants={isBatterySavingOn ? {} : fadeIn("right", 200, 0)}
              initial="hidden"
              whileInView="show"
              exit="hidden"
            >
              <strong>My TechStack</strong>
            </motion.p>
            <motion.div
              className="skill-carousel-container"
              // key={`skill-carousel-${skillScreenWidth}`}
              variants={isBatterySavingOn ? {} : zoomIn(0)}
              initial="hidden"
              whileInView="show"
              exit="hidden"
            >
              <SkillSection isBatterySavingOn={isBatterySavingOn} />
            </motion.div>
            <motion.p
              className="skill-paragraph"
              variants={isBatterySavingOn ? {} : fadeIn("right", 200, 0)}
              initial="hidden"
              whileInView="show"
              exit="hidden"
            >
              <strong>My Workspace</strong>
            </motion.p>
            <motion.div className="last-skill-row">
              <motion.div className="last-skill-column column1">
                <a
                  href="https://github.com/Kartavya904/#topLang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="github-icon"
                >
                  <img src={github} alt="GitHub" />
                </a>

                <BarChart
                  key={topLangs}
                  topLangs={topLangs}
                  isBatterySavingOn={isBatterySavingOn}
                />
              </motion.div>
              <motion.div className="last-skill-column column2">
                <motion.div
                  className="skill-graph-carousel"
                  variants={isBatterySavingOn ? {} : zoomIn(0)}
                  initial="hidden"
                  whileInView="show"
                  exit="hidden"
                >
                  <SkillGraphCarousel
                    skills={skills}
                    isBatterySavingOn={isBatterySavingOn}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default memo(SkillPage);
