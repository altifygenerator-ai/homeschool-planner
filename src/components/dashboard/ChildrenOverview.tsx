"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight, LuPencil, LuPlus, LuTrash2, LuUserRound } from "react-icons/lu";
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setChildren(getChildren());
      setSavedWeeks(getSavedWeeks());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const realChildren = children.filter((child) => child.id !== "everyone");

  function handleAddChild(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newChildName.trim();
    if (!name) return;

    const nextChild: ChildProfile = {
      id: createId("child"),
      name,
      colorLabel: colorLabels[realChildren.length % colorLabels.length],
    };

    saveChildren([...children, nextChild]);
    setChildren(getChildren());
    setNewChildName("");
  }

  function startRename(child: ChildProfile) {
    setEditingId(child.id);
    setEditingName(child.name);
  }

  function handleRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setChildren(renameChildProfile(editingId, editingName));
    setEditingId(null);
    setEditingName("");
  }

  function handleDelete(childId: string) {
    setChildren(deleteChildProfile(childId));
  }

  return (
    <div className="children-overview-stack">
      <section className="soft-card child-manager-card">
        <div>
          <p className="eyebrow">Child profiles</p>
          <h2 className="section-title-sm">Add the children you plan for.</h2>
          <p className="section-lead">
            These names show up in the planner dropdown, saved weeks, and child
            portfolio pages. This is still stored in your browser for now.
          </p>
        </div>

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
      </section>

      {realChildren.length ? (
        <div className="children-page-grid">
          {realChildren.map((child) => {
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
                  </div>

                  <span className="child-profile-arrow">
                    <LuArrowRight />
                  </span>
                </Link>

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
