"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

// 30 minutes in milliseconds
const TIMEOUT_MS = 30 * 60 * 1000;

export function SessionTimeout() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only run the timeout if the user is logged in
    if (session && pathname !== "/login") {
      timeoutRef.current = setTimeout(() => {
        // User has been inactive for 30 minutes, log them out
        signOut({ callbackUrl: "/login" });
      }, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    // Initial setup
    resetTimer();

    // Events that indicate user activity
    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "DOMMouseScroll",
      "mousewheel",
      "touchmove",
      "MSPointerMove"
    ];

    // Throttle the reset to avoid running it too often (e.g. on every single mouse movement pixel)
    let throttleTimer = false;
    const activityHandler = () => {
      if (!throttleTimer) {
        resetTimer();
        throttleTimer = true;
        setTimeout(() => { throttleTimer = false; }, 1000); // Only reset at most once per second
      }
    };

    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, [session, pathname]);

  return null;
}
