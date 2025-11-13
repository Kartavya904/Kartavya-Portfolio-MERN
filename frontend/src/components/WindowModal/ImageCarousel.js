import { React, useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../../styles/ProjectTab.css"; // Make sure to include styles if needed

function ImagesCarousel({ data, title, isBatterySavingOn }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Always load the first image immediately for better UX
  useEffect(() => {
    if (data && data.length > 0) {
      setLoadedImages((prev) => {
        const newSet = new Set(prev);
        newSet.add(data[0]);
        return newSet;
      });
    }
  }, [data]);

  // Lazy load images using Intersection Observer
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // Fallback: load all images immediately if IntersectionObserver is not supported
      setLoadedImages(new Set(data));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imgUrl = entry.target.getAttribute("data-lazy-img");
            if (imgUrl) {
              setLoadedImages((prev) => {
                const newSet = new Set(prev);
                newSet.add(imgUrl);
                return newSet;
              });
              // Stop observing once loaded
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: "50px", // Start loading 50px before entering viewport
        threshold: 0.1, // Trigger when 10% of element is visible
      }
    );

    // Wait for Swiper to render, then observe all image containers
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        const imageContainers = containerRef.current.querySelectorAll(
          ".project-window-img-bg[data-lazy-img]"
        );
        imageContainers.forEach((container) => {
          observer.observe(container);
        });
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [data]);

  return (
    <motion.div
      ref={containerRef}
      className="project-window-images"
      initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
      animate={isBatterySavingOn ? {} : { opacity: 1, scale: 1 }}
      transition={isBatterySavingOn ? {} : { delay: 0.5, type: "ease" }}
      style={{ overflow: "hidden", margin: "0 auto" }}
    >
      <Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={50}
        slidesPerView={`${screenWidth <= 992 ? 1 : data.length === 1 ? 1 : 2}`}
        style={{
          borderRadius: "8px",
        }}
      >
        {data.map((img, index) => {
          const isLoaded = loadedImages.has(img);

          return (
            <SwiperSlide key={index}>
              <motion.div
                key={`project-window-img-${title}-${index}`}
                className="project-window-img-bg"
                data-lazy-img={img}
                // initial={{ opacity: 0, scale: 0 }}
                // animate={{ opacity: 1, scale: 1 }}
                // transition={{ delay: 0, type: "spring" }}
                style={{
                  // background: `linear-gradient(
                  //     to bottom,
                  //     rgba(0, 0, 0, 0.7) 10%,
                  //     rgba(0, 0, 0, 0.6) 30%,
                  //     rgba(0, 0, 0, 0.6) 70%,
                  //     rgba(0, 0, 0, 0.7) 90%
                  //   ), url(${img})`,
                  backgroundImage: isLoaded ? `url(${img})` : "none",
                  backgroundColor: isLoaded
                    ? "transparent"
                    : "rgba(0, 0, 0, 0.02)",
                  backgroundSize: `${"contain"}`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: `100%`,
                  minHeight: `${
                    screenWidth <= 768 ? "calc(20dvh)" : "calc(30dvh)"
                  }`,
                  maxHeight: `${
                    screenWidth <= 768 ? "calc(35dvh)" : "calc(40dvh)"
                  }`,
                  margin: "0 auto",
                  transition: "background-color 0.3s ease-in-out",
                  overflow: "hidden",
                  aspectRatio: "16 / 9",
                }}
              >
                {" "}
              </motion.div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </motion.div>
  );
}

export default ImagesCarousel;
