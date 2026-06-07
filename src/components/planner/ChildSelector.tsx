"use client";

import { useState } from "react";
import { LuPencil, LuPlus, LuSettings2, LuTrash2 } from "react-icons/lu";
import type { ChildProfile } from "@/types/planner";

type ChildSelectorProps = {
  childProfiles: ChildProfile[];
  activeChildId: string;
  onChange: (childId: string) => void;
  onAddChild?: (name: string) => void;
  onRenameChild?: (childId: string, name: string) => void;
  onDeleteChild?: (childId: string) => void;
};

export default function ChildSelector({
  childProfiles,
  activeChildId,
  onChange,
  onAddChild,
  onRenameChild,
  onDeleteChild,
}: ChildSelectorProps) {
  const [newChildName, setNewChildName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isManaging, setIsManaging] = useState(false);

  const realChildren = childProfiles.filter((child) => child.id !== "everyone");
  const canManage = Boolean(onAddChild || onRenameChild || onDeleteChild);

  function handleAddChild(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newChildName.trim();
    if (!name || !onAddChild) return;

    onAddChild(name);
    setNewChildName("");
  }

  function startRename(child: ChildProfile) {
    setEditingId(child.id);
    setEditingName(child.name);
  }

  function saveRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !onRenameChild) return;

    onRenameChild(editingId, editingName);
    setEditingId(null);
    setEditingName("");
  }

  return (
    <section className="child-selector-card child-selector-card-calm">
      <div className="child-selector-header child-selector-header-calm">
        <div>
          <p className="eyebrow">Children</p>
          <p className="child-selector-title">View the week by child.</p>
        </div>

        {canManage ? (
          <button
            className="mini-helper-button"
            type="button"
            onClick={() => setIsManaging((current) => !current)}
          >
            <LuSettings2 />
            {isManaging ? "Done" : "Manage"}
          </button>
        ) : null}
      </div>

      <div className="child-selector-row" aria-label="View planner by child">
        <button
          className={`child-chip ${activeChildId === "all" ? "active" : ""}`}
          type="button"
          onClick={() => onChange("all")}
        >
          All
        </button>

        {realChildren.map((child) => (
          <button
            className={`child-chip ${activeChildId === child.id ? "active" : ""}`}
            type="button"
            onClick={() => onChange(child.id)}
            key={child.id}
          >
            {child.name}
          </button>
        ))}
      </div>

      {canManage && isManaging ? (
        <div className="child-manager-inline">
          <form className="child-add-form" onSubmit={handleAddChild}>
            <label className="field-label" htmlFor="newChildName">
              Add a child
            </label>
            <div className="child-add-row">
              <input
                className="input"
                id="newChildName"
                placeholder="Child name"
                value={newChildName}
                onChange={(event) => setNewChildName(event.target.value)}
              />
              <button className="mini-icon-button" type="submit" aria-label="Add child">
                <LuPlus />
              </button>
            </div>
          </form>

          {realChildren.length ? (
            <div className="child-edit-list">
              {realChildren.map((child) =>
                editingId === child.id ? (
                  <form className="child-edit-row" onSubmit={saveRename} key={child.id}>
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
                  <div className="child-edit-row" key={child.id}>
                    <span>{child.name}</span>
                    <button
                      className="mini-icon-button"
                      type="button"
                      onClick={() => startRename(child)}
                      aria-label={`Rename ${child.name}`}
                    >
                      <LuPencil />
                    </button>
                    <button
                      className="mini-icon-button danger"
                      type="button"
                      onClick={() => onDeleteChild?.(child.id)}
                      aria-label={`Delete ${child.name}`}
                    >
                      <LuTrash2 />
                    </button>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="form-helper-text">
              Add a child when you are ready. You can still plan for Everyone.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
