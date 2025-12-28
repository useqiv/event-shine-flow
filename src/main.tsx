import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent 3rd‑party browser extensions from crashing the app.
// We only suppress errors originating from extension URLs (chrome-extension://, moz-extension://).
const isExtensionSource = (text?: string) =>
  !!text && (text.includes("chrome-extension://") || text.includes("moz-extension://"));

const getReasonMessage = (reason: unknown) => {
  if (typeof reason === "string") return reason;
  if (reason && typeof reason === "object" && "message" in reason) {
    const msg = (reason as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "";
};

const getReasonStack = (reason: unknown) => {
  if (reason && typeof reason === "object" && "stack" in reason) {
    const st = (reason as { stack?: unknown }).stack;
    if (typeof st === "string") return st;
  }
  return "";
};

window.addEventListener("unhandledrejection", (event) => {
  const stack = getReasonStack(event.reason);
  if (isExtensionSource(stack)) {
    const msg = getReasonMessage(event.reason);
    console.warn("Suppressed extension unhandled rejection:", msg || stack);
    event.preventDefault();
  }
});

window.addEventListener(
  "error",
  (event) => {
    const filename = typeof event.filename === "string" ? event.filename : "";
    const stack = event.error ? String((event.error as { stack?: unknown }).stack ?? "") : "";

    if (isExtensionSource(filename) || isExtensionSource(stack)) {
      const message = typeof event.message === "string" ? event.message : "";
      console.warn("Suppressed extension error:", message || filename);
      event.preventDefault();
    }
  },
  true
);

createRoot(document.getElementById("root")!).render(<App />);
