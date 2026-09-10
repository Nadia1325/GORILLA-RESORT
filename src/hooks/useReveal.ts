import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to the returned ref and adds
 * `is-visible` the first time the element scrolls into view. Pairs with
 * the `.reveal` utility class in index.css.
 *
 * Safety net: if IntersectionObserver is unavailable, misbehaves, or simply
 * never fires (e.g. a layout edge case, or an element already in view at
 * mount before the observer's first callback), a fallback timer forces the
 * element visible after a short delay. Content should never be permanently
 * hidden because of this hook.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reveal = () => node.classList.add("is-visible");

    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);

    // Fallback: guarantee visibility even if the observer never fires.
    const fallback = window.setTimeout(reveal, 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [threshold]);

  return ref;
}
