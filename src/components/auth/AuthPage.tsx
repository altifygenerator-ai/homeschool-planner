"use client";

import { useState } from "react";
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
  createChildSupabaseAccount,
  createParentLocalAccount,
  loginLocalAccount,
  startGuestSession,
} from "@/lib/localAuth";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "create";
  const initialAccountType =
    searchParams.get("role") === "child" || searchParams.get("invite") ? "child" : "parent";
  const initialInviteCode = searchParams.get("invite") ?? "";
  const initialName = initialAccountType === "child" ? searchParams.get("name") ?? "" : "";

  const [mode, setMode] = useState<"create" | "login">(initialMode);
  const [accountType, setAccountType] = useState<"parent" | "child">(initialAccountType);
  const [name, setName] = useState(initialName);
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, setLogin] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  function finish() {
    router.push("/dashboard/planner");
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsWorking(true);

    const result =
      accountType === "child"
        ? await createChildSupabaseAccount({
            name: name.trim() || "Student",
            email,
            password,
            inviteCode,
          })
        : await createParentLocalAccount({
            name: name.trim() || "Parent",
            email,
            password,
            familyName: familyName.trim() || undefined,
          });

    setIsWorking(false);

    if (!result.ok || result.needsEmailConfirm) {
      setMessage(result.message || "Something did not finish. Try again in a minute.");
      return;
    }

    finish();
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsWorking(true);

    const result = await loginLocalAccount(login, loginPassword, inviteCode);
    setIsWorking(false);

    if (!result.ok) {
      setMessage(result.message || "I could not log in with that email and password.");
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
            Save your homeschool planner under a family account.
          </h1>
          <p className="section-lead">
            Create a family planner, log back in from another device, or try
            SoftWeek as a guest first. Beta accounts are free while SoftWeek is
            being tested with homeschool families.
          </p>

          <div className="auth-promise-card soft-card">
            <LuLock />
            <div>
              <strong>Your weekly records stay with your family account.</strong>
              <p>
                Beta accounts are meant for real testing now, with better saved
                records and fuller planning tools coming as SoftWeek grows.
              </p>
            </div>
          </div>

          <div className="auth-mini-grid">
            <div>
              <strong>Parent account</strong>
              <span>Full planner, child profiles, automatic weekly records, and categories.</span>
            </div>
            <div>
              <strong>Child account option</strong>
              <span>Older kids can mark work done and add notes with limits.</span>
            </div>
            <div>
              <strong>Guest mode</strong>
              <span>Try the planner first without saving to an account.</span>
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
              <div className="auth-account-type-row" aria-label="Account type">
                <button
                  className={accountType === "parent" ? "active" : ""}
                  type="button"
                  onClick={() => setAccountType("parent")}
                >
                  Parent
                </button>
                <button
                  className={accountType === "child" ? "active" : ""}
                  type="button"
                  onClick={() => setAccountType("child")}
                >
                  Child invite
                </button>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="name">
                  {accountType === "child" ? "Child name" : "Your name"}
                </label>
                <input
                  className="input"
                  id="name"
                  placeholder={accountType === "child" ? "Student name" : "Jake, Sarah, Mom, Dad..."}
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
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <input
                  className="input"
                  id="password"
                  placeholder="At least 6 characters"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {accountType === "parent" ? (
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
              ) : (
                <div className="field-group">
                  <label className="field-label" htmlFor="inviteCode">
                    Child invite code
                  </label>
                  <input
                    className="input"
                    id="inviteCode"
                    placeholder="Code from the parent account"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                  />
                </div>
              )}

              <button className="btn btn-primary" type="submit" disabled={isWorking}>
                <LuUserPlus />
                {isWorking ? "Setting up..." : "Create beta account"}
              </button>
            </form>
          ) : (
            <form className="form-grid" onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label" htmlFor="login">
                  Email
                </label>
                <input
                  className="input"
                  id="login"
                  placeholder="you@example.com"
                  type="email"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="loginPassword">
                  Password
                </label>
                <input
                  className="input"
                  id="loginPassword"
                  placeholder="Your password"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="loginInviteCode">
                  Child invite code, only if this is the first child login
                </label>
                <input
                  className="input"
                  id="loginInviteCode"
                  placeholder="Leave blank unless needed"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={isWorking}>
                <LuMail />
                {isWorking ? "Logging in..." : "Log in"}
              </button>
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
            beta account so your family setup and weekly records can stay together.
          </p>

          <Link className="auth-back-link" href="/">
            Back to overview <LuArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
