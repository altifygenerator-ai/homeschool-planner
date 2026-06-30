"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowRight,
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
} from "@/lib/localAuth";
import {
  deleteChildProfile,
  getChildren,
  getSavedWeeks,
  renameChildProfile,
  saveChildren,
} from "@/lib/plannerStorage";
import { createId } from "@/lib/utils";
import type { ChildProfile, SavedWeekLog } from "@/types/planner";

const colorLabels: ChildProfile["colorLabel"][] = ["sage", "gold", "clay", "blue"];

export default function ChildrenOverview() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);
  const [newChildName, setNewChildName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [message, setMessage] = useState("");
  const [context, setContext] = useState<AccountContext | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setContext(getActiveAccountContext());
      setChildren(getChildren());
      setSavedWeeks(getSavedWeeks());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const realChildren = children
    .filter((child) => child.id !== "everyone")
    .filter((child) =>
      context?.isChild && context.session.childId
        ? child.id === context.session.childId
        : true
    );
  const canManage = context?.isParent ?? true;

  function handleAddChild(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newChildName.trim();
    if (!name || !canManage) return;

    const nextChild: ChildProfile = {
      id: createId("child"),
      name,
      colorLabel: colorLabels[realChildren.length % colorLabels.length],
    };

    saveChildren([...children, nextChild]);
    setChildren(getChildren());
    setNewChildName("");
    setMessage(`${name} added.`);
  }

  function startRename(child: ChildProfile) {
    setEditingId(child.id);
    setEditingName(child.name);
  }

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !canManage) return;

    setChildren(renameChildProfile(editingId, editingName));
    setEditingId(null);
    setEditingName("");
    setMessage("Child profile updated.");
  }

  function handleDelete(childId: string) {
    if (!canManage) return;
    setChildren(deleteChildProfile(childId));
    setMessage("Child profile removed.");
  }

  function handleCreateChildLogin(child: ChildProfile) {
    const account = createChildLocalAccount(child.id, child.name);

    if (!account) {
      setMessage("Child logins can only be created from a parent account.");
      return;
    }

    setMessage(`${child.name}'s child login is: ${account.loginName}`);
  }

  return (
    <div className="children-overview-stack">
      <section className="soft-card child-manager-card">
        <div>
          <p className="eyebrow">Child profiles</p>
          <h2 className="section-title-sm">Add the children you plan for.</h2>
          <p className="section-lead">
            Child profiles connect the planner, saved weeks, and portfolio views.
            Parent accounts can manage these, and older kids can have limited
            local logins when you want them to help mark work done.
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
            This child login can view records, but profile management stays with
            the parent account.
          </p>
        )}

        {message ? <p className="planner-save-message">{message}</p> : null}
      </section>

      {realChildren.length ? (
        <div className="children-page-grid">
          {realChildren.map((child) => {
            const childLogin = getChildAccount(child.id);
            const summaries = savedWeeks.flatMap((week) =>
              week.childSummaries.filter((summary) => summary.childId === child.id)
            );

            const completedTotal = summaries.reduce(
              (total, summary) => total + summary.completedCount,
              0
            );

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
                        ? `${summaries.length} saved week${summaries.length === 1 ? "" : "s"} in this portfolio.`
                        : "No saved weeks yet."}
                    </p>
                  </div>

                  <div className="pill-row">
                    <span className="pill pill-sage">{completedTotal} completed</span>
                    <span className="pill">View portfolio</span>
                    {childLogin ? <span className="pill pill-gold">Child login ready</span> : null}
                  </div>

                  <span className="child-profile-arrow">
                    <LuArrowRight />
                  </span>
                </Link>

                {canManage ? (
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
                          onClick={() => handleCreateChildLogin(child)}
                        >
                          <LuKeyRound />
                          {childLogin ? childLogin.loginName : "Create child login"}
                        </button>
                        <button
                          className="mini-text-button danger"
                          type="button"
                          onClick={() => handleDelete(child.id)}
                        >
                          <LuTrash2 />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
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
