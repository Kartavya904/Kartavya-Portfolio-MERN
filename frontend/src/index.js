import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import "./index.css";
import Loading from "./components/SpecialComponents/Loading";

const Root = () => {
  const [isReady, setIsReady] = useState(false);
  const [isBatterySavingOn, setIsBatterySavingOn] = useState(false);
  const [appMountDelayDone, setAppMountDelayDone] = useState(false);

  // Show loading first; mount app behind it after 400ms (first greeting visible)
  useEffect(() => {
    const t = setTimeout(() => setAppMountDelayDone(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {appMountDelayDone && (
        <App
          isBatterySavingOn={isBatterySavingOn}
          setIsBatterySavingOn={setIsBatterySavingOn}
          isLoadingComplete={isReady}
        />
      )}
      {!isReady && (
        <Loading
          isBatterySavingOn={isBatterySavingOn}
          setIsBatterySavingOn={setIsBatterySavingOn}
          onComplete={() => setIsReady(true)}
        />
      )}
    </>
  );
};

// Strict Mode for testing purposes during development
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
