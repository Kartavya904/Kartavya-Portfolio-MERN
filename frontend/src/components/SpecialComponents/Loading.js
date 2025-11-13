import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../../styles/Loading.css";
import { pingBackend, pingDatabase } from "../../services/ping";

const greetings = ["Hello", "नमस्ते", "Bonjour", "こんにちは", "مرحبا"];

const Loading = ({ isBatterySavingOn, setIsBatterySavingOn, onComplete }) => {
  const [status, setStatus] = useState({ backend: false, database: false });
  const [loaded, setLoaded] = useState(false);
  const [imagesReady, setImagesReady] = useState(false); // Condition based solely on must-load images
  const [mustLoadImageStatus, setMustLoadImageStatus] = useState({
    loaded: 0,
    total: 0,
    error: false,
  });
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [allGreetingsShown, setAllGreetingsShown] = useState(false);
  const [stats, setStats] = useState({
    prefersReducedMotion: false,
    isLowBattery: false,
    lowPerformanceDevice: false,
    lowMemoryDevice: false,
    isCpuThrottled: false,
    isTouchDevice: false,
    cpuTestDuration: null,
  });

  // Rotate greetings every 400ms and mark when all have been shown.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreetingIndex((prevIndex) => {
        if (prevIndex + 1 === greetings.length) {
          setAllGreetingsShown(true);
        }
        return (prevIndex + 1) % greetings.length;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Check backend and database status and then fire image preloading APIs.
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // const backendStatus = await pingBackend();
        const databaseStatus = await pingDatabase();
        const backendStatus = databaseStatus;
        setStatus({ backend: backendStatus, database: databaseStatus });
        if (backendStatus && databaseStatus) {
          setLoaded(true);
          // Start must-load images preloading (these block loading completion)
          async function preloadMustLoadImages() {
            try {
              const response = await fetch(
                `${process.env.REACT_APP_API_URI}/must-load-images`
              );
              const urls = await response.json();
              // console.log("Must-load Image URLs: ", urls);

              // For each must-load image, create and append a preload link.
              urls.forEach((url) => {
                const link = document.createElement("link");
                link.rel = "preload";
                link.as = "image";
                link.href = url;
                document.head.appendChild(link);
              });

              // Mark images as ready (we assume the browser will handle preloading).
              setMustLoadImageStatus({
                loaded: urls.length,
                total: urls.length,
                error: false,
              });
              setImagesReady(true);
            } catch (error) {
              console.error("Error preloading must-load images:", error);
              setMustLoadImageStatus((prev) => ({ ...prev, error: true }));
              setImagesReady(true);
            }
          }
          preloadMustLoadImages();

          // Dynamic images will be lazy-loaded when they come into view
          // No need to preload all images upfront
        }
      } catch (error) {
        console.error("Error checking backend or database status:", error);
      }
    };

    if (!loaded) {
      checkStatus();
    }
  }, [loaded]);

  // Check device performance and capabilities (unchanged)
  useEffect(() => {
    const checkPerformanceAndCapabilities = async () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const isLowBattery = navigator.getBattery
        ? await navigator
            .getBattery()
            .then((battery) => battery.level < 0.2)
            .catch(() => false)
        : false;
      const hardwareConcurrency = navigator.hardwareConcurrency || 0;
      const lowPerformanceDevice = hardwareConcurrency < 4;
      const testCpuPerformance = () => {
        const start = performance.now();
        for (let i = 0; i < 1e7; i++) Math.sqrt(i);
        return performance.now() - start;
      };
      const cpuTestDuration = testCpuPerformance();
      const isCpuThrottled = cpuTestDuration > 20;
      const deviceMemory = navigator.deviceMemory || "Unknown";
      const lowMemoryDevice = deviceMemory !== "Unknown" && deviceMemory < 4;
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSavingMode =
        prefersReducedMotion ||
        isLowBattery ||
        lowPerformanceDevice ||
        isCpuThrottled ||
        lowMemoryDevice;
      setStats({
        prefersReducedMotion,
        isLowBattery,
        lowPerformanceDevice,
        lowMemoryDevice,
        isCpuThrottled,
        isTouchDevice,
        cpuTestDuration: cpuTestDuration.toFixed(2),
      });
      //setIsBatterySavingOn(isSavingMode);
      setIsBatterySavingOn(false);
    };

    checkPerformanceAndCapabilities();
    const reducedMotionMediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    reducedMotionMediaQuery.addEventListener(
      "change",
      checkPerformanceAndCapabilities
    );
    return () => {
      reducedMotionMediaQuery.removeEventListener(
        "change",
        checkPerformanceAndCapabilities
      );
    };
  }, [setIsBatterySavingOn]);

  // Trigger onComplete when backend/database loaded, greetings are shown, and must-load images are ready.
  useEffect(() => {
    if (loaded && allGreetingsShown && imagesReady && onComplete) {
      onComplete();
    }
  }, [loaded, allGreetingsShown, imagesReady, onComplete]);

  // Update scale for loading content.
  useEffect(() => {
    const updateScale = () => {
      const loadingContainer = document.querySelector(".loading-content");
      if (!loadingContainer) return;
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      let scaleValue = 1;
      if (screenHeight < 826 && screenWidth > 576) {
        scaleValue = screenHeight / 826;
      }
      loadingContainer.style.zoom = `${scaleValue}`;
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return !loaded || !allGreetingsShown || !imagesReady ? (
    <motion.div
      className="loading-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="loading-content">
        <div
          className="current-mode"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: isBatterySavingOn ? "red" : "green",
          }}
        ></div>
        <div
          className="stats-box"
          style={{
            position: "absolute",
            top: "40px",
            right: "10px",
            padding: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            borderRadius: "5px",
            fontSize: "12px",
            lineHeight: "1.5",
          }}
        >
          <div>Reduced Motion: {stats.prefersReducedMotion ? "Yes" : "No"}</div>
          <div>Low Battery: {stats.isLowBattery ? "Yes" : "No"}</div>
          <div>
            Low Performance: {stats.lowPerformanceDevice ? "Yes" : "No"}
          </div>
          <div>Low Memory: {stats.lowMemoryDevice ? "Yes" : "No"}</div>
          <div>CPU Throttled: {stats.isCpuThrottled ? "Yes" : "No"}</div>
          <div>CPU Test Duration: {stats.cpuTestDuration} ms</div>
          <div>Touch Device: {stats.isTouchDevice ? "Yes" : "No"}</div>
        </div>
        <div className="greeting">
          <motion.h1
            key={greetings[currentGreetingIndex]}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {greetings[currentGreetingIndex]}
          </motion.h1>
        </div>
        <div className="status">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Connecting to Backend {status.backend && <span>✅</span>}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Connecting to Database {status.database && <span>✅</span>}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            {isBatterySavingOn
              ? "Reducing Animations Due to Weak Device ❌"
              : "ontouchstart" in window || navigator.maxTouchPoints > 0
              ? "Reducing Animations for Touch Devices ✅"
              : "Amplifying Animations ✅"}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            {mustLoadImageStatus.error
              ? "Loading Must-Load Images Failed ❌"
              : `Loading Must-Load Images (${mustLoadImageStatus.loaded}/${mustLoadImageStatus.total})`}
          </motion.p>
        </div>
      </div>
    </motion.div>
  ) : null;
};

export default Loading;
