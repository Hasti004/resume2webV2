import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import "./App.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = "<div style='padding:2rem;font-family:sans-serif;'>No #root element found.</div>";
} else {
  try {
    const root = createRoot(rootEl);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (err) {
    console.error("Failed to mount app:", err);
    rootEl.innerHTML = `<div style='padding:2rem;font-family:sans-serif;color:#1a1a1a;'><h1>Failed to load</h1><pre>${String(err)}</pre></div>`;
  }
}
