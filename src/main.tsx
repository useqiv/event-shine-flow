import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle unhandled promise rejections from browser extensions (like MetaMask)
// to prevent them from crashing the app
window.addEventListener('unhandledrejection', (event) => {
  // Check if the error is from a browser extension
  if (event.reason?.message?.includes('MetaMask') || 
      event.reason?.stack?.includes('chrome-extension://') ||
      event.reason?.stack?.includes('moz-extension://')) {
    console.warn('Browser extension error caught:', event.reason?.message);
    event.preventDefault(); // Prevent the error from crashing the app
  }
});

createRoot(document.getElementById("root")!).render(<App />);
