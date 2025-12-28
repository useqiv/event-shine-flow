import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle unhandled promise rejections / errors from browser extensions (like MetaMask)
// to prevent them from crashing the app
const isExtensionStack = (stack?: string) =>
  !!stack && (stack.includes('chrome-extension://') || stack.includes('moz-extension://'));

const getReasonText = (reason: unknown) => {
  if (typeof reason === 'string') return reason;
  if (reason && typeof reason === 'object' && 'message' in reason) {
    const msg = (reason as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return String(reason);
};

window.addEventListener('unhandledrejection', (event) => {
  const reasonText = getReasonText(event.reason);
  const stackText =
    event.reason && typeof event.reason === 'object' && 'stack' in event.reason
      ? String((event.reason as { stack?: unknown }).stack)
      : '';

  if (reasonText.includes('MetaMask') || isExtensionStack(stackText)) {
    console.warn('Browser extension unhandled rejection caught:', reasonText);
    event.preventDefault(); // prevent 3rd-party monitors from treating it as an app crash
  }
});

window.addEventListener(
  'error',
  (event) => {
    const message = typeof event.message === 'string' ? event.message : '';
    const filename = typeof event.filename === 'string' ? event.filename : '';
    const stack = event.error ? String((event.error as { stack?: unknown }).stack ?? '') : '';

    if (
      message.includes('MetaMask') ||
      filename.startsWith('chrome-extension://') ||
      filename.startsWith('moz-extension://') ||
      isExtensionStack(stack)
    ) {
      console.warn('Browser extension error caught:', message || filename);
      event.preventDefault();
    }
  },
  true
);

createRoot(document.getElementById("root")!).render(<App />);
