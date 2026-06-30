"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LuArrowRight,
  LuLock,
  LuMail,
  LuMousePointerClick,
  LuUserPlus,
} from "react-icons/lu";
import {
  createParentLocalAccount,
  getLocalAccounts,
  loginLocalAccount,
  startGuestSession,
} from "@/lib/localAuth";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "create";

  const [mode, setMode] = useState<"create" | "login">(initialMode);
  const [name, setName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState("");
  const [message, setMessage] = useState("");

  const existingAccounts = useMemo(() => getLocalAccounts(), []);
  const hasLocalAccounts = existingAccounts.some((account) => !account.email.includes("guest@"));

  function finish() {
    router.push("/dashboard/planner");
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMessage("Add an email so this beta account has a login name.");
      return;
    }

    createParentLocalAccount({
      name: name.trim() || "Parent",
      email: cleanEmail,
      familyName: familyName.trim() || undefined,
    });

    finish();
  }

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = loginLocalAccount(login);
    if (!result) {
      setMessage("I could not find that account on this device yet.");
      return;
    }

    finish();
  }

  function handleGuest() {
    startGuestSession();
    finish();
  }

  return (
    <section className="section auth-section">
      <div className="container auth-grid">
        <div className="auth-copy">
          <p className="eyebrow">SoftWeek beta accounts</p>
          <h1 className="section-title">
            Start planning with a simple beta account.
          </h1>
          <p className="section-lead">
            Create a family workspace, log back into an account on this device,
            or try SoftWeek as a guest before setting anything up. This early
            beta is built to test the planning flow before the fuller account
            release.
          </p>

          <div className="auth-promise-card soft-card">
            <LuLock />
            <div>
              <strong>Good for testing, not your only permanent record yet.</strong>
              <p>
                This beta keeps your family workspace separated on this device.
                The full release is being built for backed-up accounts, safer
                records, and easier access across devices.
              </p>
            </div>
          </div>

          <div className="auth-mini-grid">
            <div>
              <strong>Parent account</strong>
              <span>Full planner, child profiles, saved weeks, categories.</span>
            </div>
            <div>
              <strong>Child login option</strong>
              <span>Older kids can mark work done and add notes with limits.</span>
            </div>
            <div>
              <strong>Guest mode</strong>
              <span>Try the planner first without setting up a family account.</span>
            </div>
          </div>
        </div>

        <div className="auth-card soft-card">
          <div className="auth-tabs" aria-label="Account mode">
            <button
              className={mode === "create" ? "active" : ""}
              type="button"
              onClick={() => setMode("create")}
            >
              Create account
            </button>
            <button
              className={mode === "login" ? "active" : ""}
              type="button"
              onClick={() => setMode("login")}
            >
              Log in
            </button>
          </div>

          {mode === "create" ? (
            <form className="form-grid" onSubmit={handleCreate}>
              <div className="field-group">
                <label className="field-label" htmlFor="name">
                  Your name
                </label>
                <input
                  className="input"
                  id="name"
                  placeholder="Jake, Sarah, Mom, Dad..."
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="email">
                  Email
                </label>
                <input
                  className="input"
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="familyName">
                  Family name, optional
                </label>
                <input
                  className="input"
                  id="familyName"
                  placeholder="The Johnson family"
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                />
              </div>

              <button className="btn btn-primary" type="submit">
                <LuUserPlus />
                Create beta account
              </button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label" htmlFor="login">
                  Email or child login
                </label>
                <input
                  className="input"
                  id="login"
                  placeholder="you@example.com or child login name"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                />
              </div>

              <button className="btn btn-primary" type="submit">
                <LuMail />
                Log in
              </button>

              {!hasLocalAccounts ? (
                <p className="text-small">
                  No accounts found on this device yet. Create one here, or try
                  guest mode first.
                </p>
              ) : null}
            </form>
          )}

          {message ? <p className="auth-message">{message}</p> : null}

          <div className="auth-divider">
            <span />
            <p>or</p>
            <span />
          </div>

          <button className="btn btn-secondary auth-guest-button" type="button" onClick={handleGuest}>
            <LuMousePointerClick />
            Try as guest
          </button>

          <p className="text-small auth-footnote">
            Guest mode is just for trying the planner. For real use, create a
            beta account so your family setup and saved weeks stay together on
            this device.
          </p>

          <Link className="auth-back-link" href="/">
            Back to overview <LuArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
