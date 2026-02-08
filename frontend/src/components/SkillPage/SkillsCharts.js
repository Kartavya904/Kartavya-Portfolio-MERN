import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { zoomIn } from "../../services/variants";
import SkillGraphCarousel from "./SkillGraph";
import github from "../../assets/img/icons/github.png";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
);

const BarChart = ({ topLangs, isBatterySavingOn }) => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        className: "skill-paragraph",
        text: "Coding Hours by Language",
        color: "#edeeef",
      },
    },
    scales: {
      x: {
        ticks: { color: "#edeeef", font: { size: 12 } },
        grid: { display: true },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 450,
        ticks: { color: "#edeeef", stepSize: 50, font: { size: 12 } },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        animation: { duration: 5000, easing: "easeOutQuart" },
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

const ioOptions = { threshold: 0.1, rootMargin: "0px 0px 50px 0px" };

export default function SkillsCharts({ topLangs, skills, isBatterySavingOn }) {
  const column1Ref = useRef(null);
  const column2Ref = useRef(null);
  const [column1InView, setColumn1InView] = useState(false);
  const [column2InView, setColumn2InView] = useState(false);

  useEffect(() => {
    let mounted = true;
    const el1 = column1Ref.current;
    if (!el1) return;
    const observer = new IntersectionObserver((entries) => {
      try {
        if (!mounted) return;
        for (const entry of entries) setColumn1InView(entry.isIntersecting);
      } catch (e) {
        if (process.env.NODE_ENV !== "production")
          console.warn("[SkillsCharts column1 IO]", e);
      }
    }, ioOptions);
    observer.observe(el1);
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const el2 = column2Ref.current;
    if (!el2) return;
    const observer = new IntersectionObserver((entries) => {
      try {
        if (!mounted) return;
        for (const entry of entries) setColumn2InView(entry.isIntersecting);
      } catch (e) {
        if (process.env.NODE_ENV !== "production")
          console.warn("[SkillsCharts column2 IO]", e);
      }
    }, ioOptions);
    observer.observe(el2);
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <motion.div
        ref={column1Ref}
        className="last-skill-column column1"
        style={!column1InView ? { minHeight: 280 } : undefined}
      >
        {column1InView ? (
          <>
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
          </>
        ) : null}
      </motion.div>
      <motion.div
        ref={column2Ref}
        className="last-skill-column column2"
        style={!column2InView ? { minHeight: 280 } : undefined}
      >
        {column2InView ? (
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
        ) : null}
      </motion.div>
    </>
  );
}
