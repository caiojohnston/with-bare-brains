import { useEffect, useState } from "react";

export function useTypewriter(text: string, speedMs = 70): { display: string; done: boolean } {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    if (!text) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      return;
    }
    const interval = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, speedMs);
    return () => clearInterval(interval);
  }, [text, speedMs]);

  return { display: text.slice(0, count), done: count >= text.length };
}
