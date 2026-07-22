"use client";

import { useEffect } from "react";

const CACHE_PREFIX = "softweek-";

async function removeDevelopmentWorkers() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.allSettled(
        keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)),
      );
    }
  } catch {
    // A failed cleanup should never prevent the app from loading in development.
  }
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

    if (isDevelopment || isLocalhost) {
      void removeDevelopmentWorkers();
      return;
    }

    if (!("serviceWorker" in navigator) || window.location.protocol !== "https:") return;

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
        await registration.update();
      } catch {
        // PWA support is optional. The web application remains usable.
      }
    };

    if (document.readyState === "complete") {
      void registerWorker();
      return;
    }

    const handleLoad = () => void registerWorker();
    window.addEventListener("load", handleLoad, { once: true });
    return () => window.removeEventListener("load", handleLoad);
  }, []);

  return null;
}
