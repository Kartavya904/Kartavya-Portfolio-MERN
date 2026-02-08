import React, { useEffect, useRef } from "react";

const GRADIENT_LUT_SIZE = 256;
const RESIZE_DEBOUNCE_MS = 150;

const gradientStops = [
  { offset: 0, color: [255, 111, 97] }, // Coral
  { offset: 0.2, color: [244, 208, 63] }, // Yellow
  { offset: 0.4, color: [142, 68, 173] }, // Purple
  { offset: 0.6, color: [26, 188, 156] }, // Aqua
  { offset: 0.8, color: [52, 152, 219] }, // Blue
  { offset: 1, color: [255, 111, 97] }, // Loop back to Coral
];

export const HexGrid = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // For Intersection Observer
  const mouse = useRef({ x: -100, y: -100 });
  const pendingMouse = useRef(null); // RAF-throttled mouse updates
  const breathingProgress = useRef(0);
  const direction = useRef(1);
  const breathingSpeed = 0.005;
  const gridPointsRef = useRef([]);
  const isCanvasVisible = useRef(true);
  const isTabVisible = useRef(!document.hidden);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let resizeTimeoutId;
    const hexSize = 30;
    const lightRadius = 100;

    // Precompute gradient LUT (optimization 7)
    const gradientLUT = new Array(GRADIENT_LUT_SIZE);
    for (let i = 0; i < GRADIENT_LUT_SIZE; i++) {
      const t = i / (GRADIENT_LUT_SIZE - 1);
      let startStop, endStop;
      for (let j = 0; j < gradientStops.length - 1; j++) {
        if (t >= gradientStops[j].offset && t <= gradientStops[j + 1].offset) {
          startStop = gradientStops[j];
          endStop = gradientStops[j + 1];
          break;
        }
      }
      if (!startStop || !endStop) {
        const col = gradientStops[gradientStops.length - 1].color;
        gradientLUT[i] = col;
      } else {
        const range = endStop.offset - startStop.offset;
        const localT = range === 0 ? 0 : (t - startStop.offset) / range;
        gradientLUT[i] = [
          Math.round(
            startStop.color[0] +
              localT * (endStop.color[0] - startStop.color[0]),
          ),
          Math.round(
            startStop.color[1] +
              localT * (endStop.color[1] - startStop.color[1]),
          ),
          Math.round(
            startStop.color[2] +
              localT * (endStop.color[2] - startStop.color[2]),
          ),
        ];
      }
    }
    const getGlobalGradientColor = (t, opacity) => {
      t = Math.min(Math.max(t, 0), 1);
      const idx = Math.floor(t * (GRADIENT_LUT_SIZE - 1));
      const col = gradientLUT[idx] ?? gradientLUT[GRADIENT_LUT_SIZE - 1];
      return `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${opacity})`;
    };

    const computeGridPoints = () => {
      const points = [];
      const cols = Math.ceil(canvas.width / (hexSize * 1.5));
      const rows = Math.ceil(canvas.height / (hexSize * Math.sqrt(3)));
      const denom = canvas.width * canvas.width + canvas.height * canvas.height;
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const x = col * hexSize * 1.5;
          const y =
            row * hexSize * Math.sqrt(3) +
            (col % 2 === 0 ? 0 : (hexSize * Math.sqrt(3)) / 2);
          const t = (x * canvas.width + y * canvas.height) / denom;
          points.push({ x, y, t });
        }
      }
      gridPointsRef.current = points;
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      computeGridPoints();
    };

    const debouncedResize = () => {
      if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(resizeCanvas, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", debouncedResize);
    resizeCanvas();

    // Precompute a Path2D for a hexagon centered at (0,0).
    const hexagonPath = new Path2D();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const xOffset = hexSize * Math.cos(angle);
      const yOffset = hexSize * Math.sin(angle);
      if (i === 0) hexagonPath.moveTo(xOffset, yOffset);
      else hexagonPath.lineTo(xOffset, yOffset);
    }
    hexagonPath.closePath();

    const drawHexagon = (x, y, t, opacity) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = getGlobalGradientColor(t, opacity);
      ctx.lineWidth = opacity > 0 ? 2 : 1;
      ctx.stroke(hexagonPath);
      ctx.restore();
    };

    // Draw a dark background.
    const drawBackground = () => {
      ctx.fillStyle = "#212529";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawGrid = () => {
      gridPointsRef.current.forEach(({ x, y, t }) => {
        const dx = x - mouse.current.x;
        const dy = y - mouse.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let opacity =
          distance <= lightRadius ? 1 - distance / lightRadius : 0.075;
        const animationLine = canvas.height * breathingProgress.current;
        if (y <= animationLine) opacity += 0.15;
        opacity = Math.min(Math.max(opacity, 0), 1);
        drawHexagon(x, y, t, opacity);
      });
    };

    const render = () => {
      // Throttle mouse: apply pending position once per frame (optimization 5)
      if (pendingMouse.current !== null) {
        mouse.current.x = pendingMouse.current.x;
        mouse.current.y = pendingMouse.current.y;
        pendingMouse.current = null;
      }

      const visible = isTabVisible.current && isCanvasVisible.current;
      if (visible) {
        drawBackground();
        drawGrid();
        breathingProgress.current += breathingSpeed * direction.current;
        if (breathingProgress.current >= 1 || breathingProgress.current <= 0)
          direction.current *= -1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const insideCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (insideCanvas) {
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        pendingMouse.current = {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      } else {
        pendingMouse.current = { x: -100, y: -100 };
      }
    };

    // Intersection Observer: pause drawing when canvas is off-screen (optimization 1)
    const observer =
      container &&
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isCanvasVisible.current = entry.isIntersecting;
          });
        },
        { threshold: 0, rootMargin: "0px" },
      );
    if (observer && container) observer.observe(container);

    const handleVisibilityChange = () => {
      isTabVisible.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("mousemove", handleMouseMove);
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (observer && container) {
        observer.unobserve(container);
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: 0,
        contain: "paint",
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
};
