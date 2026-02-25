import { useEffect } from "react";

/**
 * Enables smooth scroll behavior for anchor links (e.g. #features, #contact).
 */
export function useSmoothScroll() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (!anchor || (anchor as HTMLAnchorElement).href === window.location.href) return;
      const id = (anchor as HTMLAnchorElement).href.split("#")[1];
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);
}
