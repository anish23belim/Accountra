"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

// 30 minutes in milliseconds
const TIMEOUT_MS = 30 * 60 * 1000;
const STORAGE_KEY = "accountra_last_activity";

export function SessionTimeout() {
  const { status } = useSession();
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run if the user is authenticated and not on login page
    if (status !== "authenticated" || pathname === "/login") {
      return;
    }

    // Initialize the last activity if not present
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }

    const checkInactivity = () => {
      const lastActivityStr = localStorage.getItem(STORAGE_KEY);
      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        if (Date.now() - lastActivity > TIMEOUT_MS) {
          // User has been inactive for too long, log them out
          localStorage.removeItem(STORAGE_KEY);
          signOut({ callbackUrl: "/login" });
        }
      }
    };

    // Check every 10 seconds
    intervalRef.current = setInterval(checkInactivity, 10000);

    // Also check when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkInactivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Events that indicate user activity
    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "DOMMouseScroll",
      "mousewheel",
      "touchmove",
      "MSPointerMove",
      "click"
    ];

    // Throttle the activity update to avoid hitting localStorage too often
    let throttleTimer = false;
    const activityHandler = () => {
      if (!throttleTimer) {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        throttleTimer = true;
        setTimeout(() => { throttleTimer = false; }, 2000); // Update at most once every 2 seconds
      }
    };

    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, [status, pathname]);

  return null;
}
