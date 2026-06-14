import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import InitialLoader from './components/InitialLoader';
import './index.css';

// Suppress benign Vite dev-server WebSocket messages and HMR connection failures
if (typeof window !== "undefined") {
  const ignorePatterns = [
    "websocket",
    "web-socket",
    "vite",
    "hmr",
    "socket closed",
    "fechado sem ter sido aberto",
    "closed without being opened"
  ];

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason || "");
    if (ignorePatterns.some((pattern) => reason.toLowerCase().includes(pattern))) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const message = event.message || "";
    if (ignorePatterns.some((pattern) => message.toLowerCase().includes(pattern))) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

// Lazy load the App component using the standard extension-less format.
// This ensures Vite can analyze, optimize and transpile the module correctly in both dev and production.
const App = lazy(() => import('./App'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<InitialLoader />}>
      <App />
    </Suspense>
  </StrictMode>,
);


