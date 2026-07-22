"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight,
  LuCopy,
  LuExternalLink,
  LuKeyRound,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuUserRound,
} from "react-icons/lu";
import {
  createChildLocalAccount,
  getActiveAccountContext,
  getChildAccount,
  type AccountContext,
  type LocalAccount,
} from "@/lib/localAuth";
import {
  deleteChildProfile,
  getChildren,
  getSavedWeeks,
  renameChildProfile,
  saveChildren,
  updateChildPermission,
} from "@/lib/plannerStorage";
import { createId } from "@/lib/utils";
import { trackSoftWeekEvent } from "@/lib/usageTracking";
import type { ChildProfile, SavedWeekLog } from "@/types/planner";

const colorLabels: ChildProfile["colorLabel"][] = ["sage", "gold", "clay", "blue"];

function childSignupHref(child: ChildProfile, account: LocalAccount | null) {
  const params = new URLSearchParams({
    mode: "create",
    role: "child",
    name: child.name,
  });

  if (account?.loginName && account.loginName !== "Create a parent account first") {
    params.set("invite", account.loginName);
  }

  return `/login?${params.toString()}`;
}

function isInviteAccount(account: LocalAccount | null) {
  return account?.authProvider === "child-invite" && account.loginName !== "Create a parent account first";
}

export default function ChildrenOverview() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);
  const [newChildName, setNewChildName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [message, setMessage] = useState("");
  const [context, setContext] = useState<AccountContext | null>(null);
  const [childAccounts, setChildAccounts] = useState<Record<string, LocalAccount | null>>({});
  const [openChildAccessId, setOpenChildAccessId] = useState<string | null>(null);
  const [creatingAccessId, setCreatingAccessId] = useState<string | null>(null);
  const [copiedChildId, setCopiedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadChildren() {
    setLoadError("");
    const [nextContext, nextChildren, nextSavedWeeks] = await Promise.all([
      getActiveAccountContext(),
      getChildren(),
      getSavedWeeks(),
    ]);

    setContext(nextContext);
    setChildren(nextChildren);
    setSavedWeeks(nextSavedWeeks);

    const realChildren = nextChildren.filter((child) => child.id !== "everyone");
    const entries = await Promise.all(
      realChildren.map(async (child) => [child.id, await getChildAccount(child.id)] as const)
    );

    setChildAccounts(Object.fromEntries(entries));
  }

  useEffect(() => {
    let isMounted = true;
    async function start() {
      try {
        const [nextContext, nextChildren, nextSavedWeeks] = await Promise.all([
          getActiveAccountContext(),
          getChildren(),
          getSavedWeeks(),
        ]);
        const accountEntries = await Promise.all(
          nextChildren
            .filter((child) => child.id !== "everyone")
            .map(async (child) => [child.id, await getChildAccount(child.id)] as const),
        );
        if (!isMounted) return;
        setContext(nextContext);
        setChildren(nextChildren);
        setSavedWeeks(nextSavedWeeks);
        setChildAccounts(Object.fromEntries(accountEntries));
      } catch (error) {
        if (isMounted) setLoadError(error instanceof Error ? error.message : "Family profiles could not be loaded.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void start();
    return () => { isMounted = false; };
  }, []);

  const realChildren = children
    .filter((child) => child.id !== "everyone")
    .filter((child) =>
      context?.isChild && context.session.childId
        ? child.id === context.session.childId
        : true
    );
  const canManage = context?.isParent ?? false;

  async function handleAddChild(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newChildName.trim();
    if (!name || !canManage) return;

    const nextChild: ChildProfile = {
      id: createId("child"),
      name,
      colorLabel: colorLabels[realChildren.length % colorLabels.length],
      permissionLevel: "checklist",
    };

    try {
      await saveChildren([...children, nextChild]);
      await loadChildren();
      setNewChildName("");
      setMessage(`${name} added. You can assign plans to them from the planner.`);
      void trackSoftWeekEvent("child_added", { source: "children" });
      if (realChildren.length === 0) void trackSoftWeekEvent("first_child_created", { source: "children" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That child profile could not be added.");
    }
  }

  function startRename(child: ChildProfile) {
    setEditingId(child.id);
    setEditingName(child.name);
  }

  async function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !canManage) return;

    try {
      setChildren(await renameChildProfile(editingId, editingName));
      setEditingId(null);
      setEditingName("");
      setMessage("Child profile updated.");
      void trackSoftWeekEvent("child_updated", { source: "children", childId: editingId });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That child profile could not be renamed.");
    }
  }

  async function handleDelete(childId: string) {
    if (!canManage) return;
    try {
      setChildren(await deleteChildProfile(childId));
      setMessage("Child profile removed from active planning. Weekly records stay in your history.");
      void trackSoftWeekEvent("child_removed", { source: "children", childId });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That child profile could not be removed.");
    }
  }

  async function handleChildAccess(child: ChildProfile) {
    if (!canManage) return;

    const existing = childAccounts[child.id];

    if (existing) {
      setOpenChildAccessId((current) => (current === child.id ? null : child.id));
      setMessage("");
      return;
    }

    if (context?.isGuest) {
      setOpenChildAccessId(child.id);
      setMessage("Create a parent account first, then you can make child invite codes.");
      return;
    }

    try {
      setCreatingAccessId(child.id);
      const account = await createChildLocalAccount(child.id, child.name);

      if (!account) {
        setMessage("Child accounts can only be created from a parent account.");
        return;
      }

      await loadChildren();
      setOpenChildAccessId(child.id);

      if (account.loginName === "Create a parent account first") {
        setMessage("Create a parent account first, then you can make child invite codes.");
        return;
      }

      setMessage(`${child.name}'s child invite is ready.`);
      void trackSoftWeekEvent("child_invite_created", {
        source: "children",
        childId: child.id,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That child invite could not be created.");
    } finally {
      setCreatingAccessId(null);
    }
  }


  async function handlePermission(child: ChildProfile, permissionLevel: NonNullable<ChildProfile["permissionLevel"]>) {
    try {
      setChildren(await updateChildPermission(child.id, permissionLevel));
      setMessage(`${child.name}'s access is now ${permissionLevel}.`);
      void trackSoftWeekEvent("child_updated", {
        source: "permission",
        childId: child.id,
        metadata: { permissionLevel },
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That access level could not be changed.");
    }
  }

  async function copyInviteCode(child: ChildProfile, account: LocalAccount | null) {
    const inviteCode = account?.loginName ?? "";
    if (!isInviteAccount(account) || !inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedChildId(child.id);
      setMessage(`${child.name}'s invite code copied.`);
      window.setTimeout(() => setCopiedChildId(null), 1800);
    } catch {
      setMessage("Could not copy the code. You can still highlight it and copy it manually.");
    }
  }

  if (loading) {
    return <section className="soft-card child-manager-card" aria-busy="true"><p>Loading family profiles…</p></section>;
  }

  if (loadError) {
    return (
      <section className="soft-card child-manager-card child-load-error" role="alert">
        <p className="eyebrow">Family</p>
        <h2 className="section-title-sm">Family profiles did not finish loading.</h2>
        <p>{loadError}</p>
        <button className="btn btn-primary" type="button" onClick={() => {
          setLoading(true);
          void loadChildren().catch((error) => {
            setLoadError(error instanceof Error ? error.message : "Family profiles could not be loaded.");
          }).finally(() => setLoading(false));
        }}>Try again</button>
      </section>
    );
  }

  return (
    <div className="children-overview-stack">
      <section className="soft-card child-manager-card">
        <div>
          <p className="eyebrow">Child profiles</p>
          <h2 className="section-title-sm">Add the children you plan for.</h2>
          <p className="section-lead">
            Start with the names you want to assign plans to. Child logins are
            optional and can be set up later for older kids who are ready to mark
            work done or add notes.
          </p>
        </div>

        {canManage ? (
          <form className="child-manager-form" onSubmit={handleAddChild}>
            <input
              className="input"
              placeholder="Child name"
              value={newChildName}
              onChange={(event) => setNewChildName(event.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              <LuPlus />
              Add child
            </button>
          </form>
        ) : (
          <p className="text-small">
            This child account can see its own profile and assigned work. Profile
            management and family records stay with the parent account.
          </p>
        )}

        {message ? <p className="planner-save-message">{message}</p> : null}
      </section>

      {realChildren.length ? (
        <div className="children-page-grid">
          {realChildren.map((child) => {
            const childLogin = childAccounts[child.id];
            const summaries = savedWeeks.flatMap((week) =>
              week.childSummaries.filter((summary) => summary.childId === child.id)
            );

            const completedTotal = summaries.reduce(
              (total, summary) => total + summary.completedCount,
              0
            );
            const panelOpen = openChildAccessId === child.id;
            const inviteReady = isInviteAccount(childLogin);
            const childLoginActive = childLogin?.authProvider === "supabase";

            return (
              <article className="child-profile-card paper-card" key={child.id}>
                <Link className="child-profile-main-link" href={`/dashboard/children/${child.id}`}>
                  <div className="child-profile-icon">
                    <LuUserRound />
                  </div>

                  <div>
                    <h2>{child.name}</h2>
                    <p>
                      {summaries.length
                        ? `${summaries.length} weekly record${summaries.length === 1 ? "" : "s"} in this portfolio.`
                        : "No weekly records yet."}
                    </p>
                  </div>

                  <div className="pill-row">
                    <span className="pill pill-sage">{completedTotal} completed</span>
                    <span className="pill">View portfolio</span>
                    {childLoginActive ? <span className="pill pill-gold">Child login active</span> : null}
                    {inviteReady ? <span className="pill pill-gold">Invite ready</span> : null}
                  </div>

                  <span className="child-profile-arrow">
                    <LuArrowRight />
                  </span>
                </Link>

                {canManage ? (
                  <>
                    <div className="child-card-actions">
                      {editingId === child.id ? (
                        <form className="child-edit-row" onSubmit={handleRename}>
                          <input
                            className="input"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            aria-label={`Rename ${child.name}`}
                          />
                          <button className="mini-text-button" type="submit">
                            Save
                          </button>
                          <button
                            className="mini-text-button"
                            type="button"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            className="mini-text-button"
                            type="button"
                            onClick={() => startRename(child)}
                          >
                            <LuPencil />
                            Rename
                          </button>
                          <button
                            className="mini-text-button"
                            type="button"
                            onClick={() => void handleChildAccess(child)}
                            disabled={creatingAccessId === child.id}
                          >
                            <LuKeyRound />
                            {creatingAccessId === child.id
                              ? "Setting up..."
                              : childLoginActive
                                ? "Child login active"
                                : inviteReady
                                  ? "View child invite"
                                  : "Set up child access"}
                          </button>
                          <label className="child-permission-select">
                            <span>Child access</span>
                            <select value={child.permissionLevel ?? "checklist"} onChange={(event) => {
                              void handlePermission(child, event.target.value as NonNullable<ChildProfile["permissionLevel"]>);
                            }}>
                              <option value="checklist">Checklist</option>
                              <option value="flexible">Flexible</option>
                              <option value="independent">Independent</option>
                            </select>
                          </label>
                          <button
                            className="mini-text-button danger"
                            type="button"
                            onClick={() => void handleDelete(child.id)}
                          >
                            <LuTrash2 />
                            Remove
                          </button>
                        </>
                      )}
                    </div>

                    {panelOpen ? (
                      <div className="child-access-panel">
                        <div>
                          <p className="eyebrow">Optional child access</p>
                          <h3>{child.name}&apos;s child login</h3>
                          <p>
                            Child access is for older kids who can help with their own week.
                            Checklist access lets them update progress and notes. Flexible
                            and Independent access can also move approved work. Parent-only
                            planning and family controls stay with you.
                          </p>
                        </div>

                        {context?.isGuest ? (
                          <div className="child-access-empty">
                            <p>
                              Guest mode cannot create child logins. Create a free
                              parent account first so the invite can be saved.
                            </p>
                            <Link className="btn btn-secondary" href="/login?mode=create">
                              Create parent account
                            </Link>
                          </div>
                        ) : childLoginActive ? (
                          <div className="child-access-empty">
                            <p>
                              A child login is already linked to this profile.
                              {childLogin?.email ? ` Login email: ${childLogin.email}.` : ""}
                            </p>
                          </div>
                        ) : inviteReady ? (
                          <div className="child-invite-box">
                            <label className="field-group">
                              <span className="field-label">Invite code</span>
                              <input className="input" value={childLogin?.loginName ?? ""} readOnly />
                            </label>

                            <div className="child-invite-actions">
                              <button
                                className="mini-text-button"
                                type="button"
                                onClick={() => void copyInviteCode(child, childLogin)}
                              >
                                <LuCopy />
                                {copiedChildId === child.id ? "Copied" : "Copy code"}
                              </button>
                              <Link className="mini-text-button" href={childSignupHref(child, childLogin)}>
                                <LuExternalLink />
                                Open child signup
                              </Link>
                            </div>

                            <p className="text-small">
                              Use the signup link with the child, or copy the code and
                              paste it into the Child invite field on the create account page.
                            </p>
                          </div>
                        ) : (
                          <p className="text-small">No invite has been created yet.</p>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <section className="paper-card empty-children-card">
          <h3>No children added yet.</h3>
          <p>
            Add a child above, then open the planner and assign plans to that
            child or to Everyone.
          </p>
          <Link className="btn btn-secondary" href="/dashboard/planner">
            Open planner
          </Link>
        </section>
      )}
    </div>
  );
}
