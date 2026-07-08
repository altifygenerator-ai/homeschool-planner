"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isLocalhost = window.location.hostname === "localhost";
    const isSecure = window.location.protocol === "https:" || isLocalhost;

    if (!isSecure) return;

    const registerWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Keep PWA registration quiet in beta. The app still works normally.
      });
    };

    if (document.readyState === "complete") {
      registerWorker();
      return;
    }

    window.addEventListener("load", registerWorker, { once: true });
    return () => window.removeEventListener("load", registerWorker);
  }, []);

  return null;
}
