"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { LuMail, LuMessageCircle, LuSend, LuX } from "react-icons/lu";
import { trackSoftWeekEvent } from "@/lib/usageTracking";

const feedbackEmail = "support@softweekplanner.com";
const feedbackPanelId = "softweek-feedback-panel";

const feedbackKinds = [
  "Something is broken",
  "Something is confusing",
  "The design feels off",
  "I have an idea",
  "Other feedback",
];

export default function BetaFeedbackWidget() {
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState(feedbackKinds[0]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const closePanel = useCallback((restoreFocus = true) => {
    setIsOpen(false);

    if (restoreFocus && typeof window !== "undefined") {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePanel, hydrated, isOpen]);

  function getCurrentPage() {
    if (typeof window === "undefined") return "Not listed";
    return `${window.location.pathname}${window.location.search}`;
  }

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`SoftWeek feedback: ${kind}`);
    const body = encodeURIComponent(`Feedback:\n${message || ""}`);
    return `mailto:${feedbackEmail}?subject=${subject}&body=${body}`;
  }, [kind, message]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();

    if (cleanMessage.length < 4) {
      setStatus("error");
      setStatusText("Add a quick note first, even if it is short.");
      return;
    }

    setStatus("sending");
    setStatusText("Sending…");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message: cleanMessage,
          email: email.trim(),
          page: getCurrentPage(),
        }),
      });

      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "Feedback could not send right now.");
      }

      setStatus("sent");
      setStatusText("Thank you. That feedback was sent.");
      setMessage("");
      void trackSoftWeekEvent("feedback_submitted", {
        source: "feedback_widget",
        metadata: { kind, page: getCurrentPage() },
      });
    } catch (error) {
      setStatus("error");
      setStatusText(
        error instanceof Error
          ? `${error.message} You can still email ${feedbackEmail}.`
          : `That did not send. You can still email ${feedbackEmail}.`,
      );
    }
  }

  const panel = hydrated && isOpen
    ? createPortal(
        <>
          <div
            className="feedback-panel-backdrop"
            aria-hidden="true"
            onMouseDown={() => closePanel()}
          />

          <aside
            ref={panelRef}
            className="feedback-side-panel"
            id={feedbackPanelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby="softweek-feedback-title"
          >
            <div className="feedback-panel-top">
              <div>
                <p className="eyebrow">Beta feedback</p>
                <h2 id="softweek-feedback-title">Tell me what is not working.</h2>
              </div>
              <button
                ref={closeRef}
                className="feedback-close-button"
                type="button"
                onClick={() => closePanel()}
                aria-label="Close feedback panel"
              >
                <LuX aria-hidden="true" />
              </button>
            </div>

            <p className="feedback-panel-text">
              If something feels confusing, broken, hard to use, too busy, or just off,
              send it here. Short notes are welcome.
            </p>

            <form className="feedback-form" onSubmit={handleSubmit}>
              <label className="field-group">
                <span className="field-label">What kind of note is this?</span>
                <select
                  className="input"
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                >
                  {feedbackKinds.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-group">
                <span className="field-label">Your note</span>
                <textarea
                  className="textarea feedback-textarea"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Example: I moved an item and could not tell if it saved."
                  rows={7}
                />
              </label>

              <label className="field-group">
                <span className="field-label">Email, optional</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Only if you want a reply"
                />
              </label>

              <p className="feedback-page-note">This will include the page you are on.</p>

              <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
                <LuSend aria-hidden="true" />
                {status === "sending" ? "Sending…" : "Send feedback"}
              </button>
            </form>

            {statusText ? (
              <p
                className={`feedback-status feedback-status-${status}`}
                role="status"
                aria-live="polite"
              >
                {statusText}
              </p>
            ) : null}

            <a className="feedback-email-link" href={mailtoHref}>
              <LuMail aria-hidden="true" />
              Or email {feedbackEmail}
            </a>
          </aside>
        </>,
        document.body,
      )
    : null;

  return (
    <div className="beta-feedback-widget">
      <button
        ref={triggerRef}
        className="feedback-corner-button"
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={hydrated && isOpen}
        aria-haspopup="dialog"
        aria-controls={feedbackPanelId}
      >
        <LuMessageCircle aria-hidden="true" />
        <span>Something off?</span>
      </button>
      {panel}
    </div>
  );
}
