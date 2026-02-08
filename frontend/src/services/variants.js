export const AppLoad = (direction) => {
  return {
    initial: {
      opacity: 0,
      y: direction === "up" ? 40 : direction === "down" ? -40 : 0,
      x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
    },
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 1 },
      easeInOut: 1,
    },
  };
};

export const fadeIn = (direction, size, delay, duration = 0.4) => {
  return {
    hidden: {
      y: direction === "up" ? size : direction === "down" ? -size : 0,
      x: direction === "left" ? size : direction === "right" ? -size : 0,
      opacity: 0,
    },
    show: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        duration: duration,
        delay: delay,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  };
};

export const zoomIn = (delay) => {
  return {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    show: {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        delay: delay,
        ease: [0.6, 0.01, 0, 0.9],
      },
    },
  };
};

export const scale = (delay) => {
  return {
    hidden: {
      scale: 0.8,
      opacity: 0,
    },
    show: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: delay,
      },
    },
  };
};
