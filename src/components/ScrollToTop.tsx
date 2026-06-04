import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Resets window scroll when the route changes (SPA default keeps previous scroll). */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search, hash]);

  return null;
}
