"use client";

import { useMemo, useState } from "react";
import { LuMail, LuMessageCircle, LuSend, LuX } from "react-icons/lu";
import { trackSoftWeekEvent } from "@/lib/usageTracking";

const feedbackEmail = "support@softweekplanner.com";

const feedbackKinds = [
  "Something is broken",
  "Something is confusing",
  "The design feels off",
  "I have an idea",
  "Other feedback",
];

export default function BetaFeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState(feedbackKinds[0]);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusText, setStatusText] = useState("");

  function getCurrentPage() {
    if (typeof window === "undefined") return "Not listed";
    return `${window.location.pathname}${window.location.search}`;
  }

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`SoftWeek feedback: ${kind}`);
    const body = encodeURIComponent(
      `Page: current page\n\nFeedback:\n${message || ""}`
    );
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
    setStatusText("Sending...");

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
          : `That did not send. You can still email ${feedbackEmail}.`
      );
    }
  }

  return (
    <div className={`beta-feedback-widget ${isOpen ? "is-open" : ""}`}>
      <button
        className="feedback-corner-button"
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="softweek-feedback-panel"
      >
        <LuMessageCircle />
        <span>Something off?</span>
      </button>

      <div className="feedback-panel-backdrop" onClick={() => setIsOpen(false)} />

      <aside
        className="feedback-side-panel"
        id="softweek-feedback-panel"
        aria-label="Send SoftWeek feedback"
      >
        <div className="feedback-panel-top">
          <div>
            <p className="eyebrow">Beta feedback</p>
            <h2>Tell me what is not working.</h2>
          </div>
          <button
            className="feedback-close-button"
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close feedback panel"
          >
            <LuX />
          </button>
        </div>

        <p className="feedback-panel-text">
          If something feels confusing, broken, hard to use, too busy, or just off,
          send it here. Short notes are welcome.
        </p>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <label className="field-group">
            <span className="field-label">What kind of note is this?</span>
            <select className="input" value={kind} onChange={(event) => setKind(event.target.value)}>
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
              placeholder="Example: I clicked Save Week and could not tell if it worked."
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
            <LuSend />
            {status === "sending" ? "Sending..." : "Send feedback"}
          </button>
        </form>

        {statusText ? (
          <p className={`feedback-status feedback-status-${status}`}>{statusText}</p>
        ) : null}

        <a className="feedback-email-link" href={mailtoHref}>
          <LuMail />
          Or email {feedbackEmail}
        </a>
      </aside>
    </div>
  );
}
