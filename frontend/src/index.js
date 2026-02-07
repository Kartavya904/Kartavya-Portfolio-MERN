import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import "./index.css";
import Loading from "./components/SpecialComponents/Loading";

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("App error:", error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ padding: 24, textAlign: "center", fontFamily: "sans-serif" }}
        >
          <h1>Something went wrong</h1>
          <p>Try refreshing the page.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log(
  "%cHey there, developer. I see you. 👀",
  "font-weight: bold; font-size: 14px;",
);
console.log(
  "No errors here (hopefully)—but I knew you'd come over here to spectate on the elements.",
);
console.log("Good luck! — A CS student who left this here for you. 🛠️");

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
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
);
