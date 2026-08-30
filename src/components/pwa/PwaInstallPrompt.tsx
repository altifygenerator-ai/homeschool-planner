"use client";

import { useEffect, useMemo, useState } from "react";
import { LuCheck, LuDownload, LuInfo, LuSmartphone, LuX } from "react-icons/lu";
import { trackSoftWeekEvent } from "@/lib/usageTracking";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallPromptProps = {
  compact?: boolean;
  className?: string;
};

function getMobilePlatform() {
  if (typeof navigator === "undefined") return "unknown";
  const userAgent = navigator.userAgent.toLowerCase();

  if (/android/.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  return "other";
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export default function PwaInstallPrompt({ compact = false, className = "" }: PwaInstallPromptProps) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"unknown" | "android" | "ios" | "other">("unknown");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setPlatform(getMobilePlatform());
      setInstalled(isStandaloneDisplay());
      setReady(true);
    }, 0);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setPromptEvent(null);
      setMessage("SoftWeek was installed. You can open it from your home screen.");
      void trackSoftWeekEvent("pwa_installed", { source: "pwa_install" });
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const fallbackText = useMemo(() => {
    if (platform === "ios") {
      return "On iPhone or iPad, open Share and choose Add to Home Screen.";
    }

    if (platform === "android") {
      return "If Install does not appear, use the browser menu and choose Install app or Add to Home screen.";
    }

    return "Use your mobile browser menu to install SoftWeek when the option appears.";
  }, [platform]);

  async function handleInstall() {
    if (!promptEvent) {
      setMessage(fallbackText);
      return;
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);

      if (choice.outcome === "accepted") {
        setMessage("SoftWeek is installing. Check your home screen when it finishes.");
        void trackSoftWeekEvent("mobile_app_install_accepted", { source: "pwa_install" });
      } else {
        setMessage("No problem. You can install it later from your browser menu.");
        void trackSoftWeekEvent("mobile_app_install_dismissed", { source: "pwa_install" });
      }
    } catch {
      setPromptEvent(null);
      setMessage(fallbackText);
    }
  }

  if (compact && (!ready || installed || dismissed || platform === "other")) return null;

  return (
    <section className={`pwa-install-card ${compact ? "pwa-install-card-compact" : ""} ${className}`.trim()}>
      <div className="pwa-install-icon" aria-hidden="true">
        {installed ? <LuCheck /> : <LuSmartphone />}
      </div>

      <div className="pwa-install-copy">
        <p className="eyebrow">{compact ? "Keep it close" : "Mobile app"}</p>
        <h2>{installed ? "SoftWeek is installed on this device." : compact ? "Put SoftWeek on your home screen." : "Install SoftWeek on your phone."}</h2>
        <p>
          {installed
            ? "Open it from your home screen like an app. Your planner and records stay the same."
            : compact
              ? "If this is becoming part of your school day, make Today one tap away."
              : "Use SoftWeek from your home screen with its own icon and app-style window. It still uses the same planner and account as the desktop site."}
        </p>

        <div className="pwa-install-actions">
          {!installed ? (
            <button className="btn btn-primary" type="button" onClick={() => void handleInstall()}>
              <LuDownload />
              Install SoftWeek
            </button>
          ) : null}

          {!compact ? (
            <p className="pwa-install-note">
              <LuInfo />
              {fallbackText}
            </p>
          ) : null}
        </div>

        {message ? <p className="pwa-install-status">{message}</p> : null}
      </div>

      {compact ? <button type="button" className="pwa-install-dismiss" aria-label="Dismiss install suggestion" onClick={() => setDismissed(true)}><LuX /></button> : null}
    </section>
  );
}
