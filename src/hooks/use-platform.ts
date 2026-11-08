"use client";

import { useEffect, useState } from "react";

export type DevicePlatform = "ios" | "android" | "desktop";

export function usePlatform() {
  const [platform, setPlatform] = useState<DevicePlatform>("desktop");
  const [origin, setOrigin] = useState<string>("http://localhost:3000");

  useEffect(() => {
    setOrigin(window.location.origin);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);

    if (isIOS) {
      setPlatform("ios");
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }
  }, []);

  return { platform, setPlatform, origin };
}