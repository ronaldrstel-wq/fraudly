"use client";

import { useEffect, useState } from "react";

const QUERY = "(max-width: 767px)";

/** True when viewport matches Tailwind `sm` breakpoint (mobile-first “phone” layout). */
export function useMobileViewport(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return mobile;
}
