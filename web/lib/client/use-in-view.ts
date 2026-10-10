"use client";

// True once the element has come near the viewport (and stays true). Used to load font
// previews of the constructor only when their chip is visible (QA 2026-10-10, m13).

import { useEffect, useRef, useState } from "react";

export function useInView<T extends Element>(rootMargin = "120px"): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    }, { rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, seen]);

  return [ref, seen];
}
