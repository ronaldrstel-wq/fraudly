"use client";

import { useEffect, useState } from "react";

/** True when the app runs as an installed PWA / home-screen web app. */
export function useStandalonePwa(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const displayStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const displayMinimal = window.matchMedia("(display-mode: minimal-ui)").matches;
    const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setStandalone(displayStandalone || displayMinimal || iosStandalone);
  }, []);

  return standalone;
}
