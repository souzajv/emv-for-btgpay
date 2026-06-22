"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

interface NavigationProgressContextValue {
  startNavigation: () => void;
}

const NavigationProgressContext =
  createContext<NavigationProgressContextValue | null>(null);

export function useNavigationProgress() {
  const ctx = useContext(NavigationProgressContext);
  if (!ctx) {
    return { startNavigation: () => {} };
  }
  return ctx;
}

export function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startNavigation = useCallback(() => {
    clearTimer();
    setLoading(true);
    setProgress(12);
    let p = 12;
    timerRef.current = setInterval(() => {
      p = Math.min(p + Math.random() * 18, 92);
      setProgress(p);
    }, 180);
  }, []);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      clearTimer();
      setProgress(100);
      const t = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 220);
      prevPath.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a[href^='/']");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href");
      if (href && href !== pathname) startNavigation();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, startNavigation]);

  return (
    <NavigationProgressContext.Provider value={{ startNavigation }}>
      {children}
      {loading && (
        <>
          <div
            className="fixed top-0 left-0 right-0 h-1 z-[60] bg-ink/10"
            aria-hidden
          >
            <div
              className="h-full bg-accent transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className="fixed inset-0 z-[55] bg-ink/25 pointer-events-none transition-opacity duration-200"
            aria-hidden
          />
        </>
      )}
    </NavigationProgressContext.Provider>
  );
}
