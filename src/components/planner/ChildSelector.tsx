"use client";

import type { ChildProfile } from "@/types/planner";

type ChildSelectorProps = {
  children: ChildProfile[];
  activeChildId: string;
  onChange: (childId: string) => void;
};

export default function ChildSelector({
  children,
  activeChildId,
  onChange,
}: ChildSelectorProps) {
  return (
    <div className="child-selector-card">
      <div>
        <p className="eyebrow">View by child</p>
        <p className="child-selector-title">Filter the week gently.</p>
      </div>

      <div className="child-selector-row">
        <button
          className={`child-chip ${activeChildId === "all" ? "active" : ""}`}
          type="button"
          onClick={() => onChange("all")}
        >
          All
        </button>

        {children.map((child) => (
          <button
            className={`child-chip ${
              activeChildId === child.id ? "active" : ""
            }`}
            type="button"
            onClick={() => onChange(child.id)}
            key={child.id}
          >
            {child.name}
          </button>
        ))}
      </div>
    </div>
  );
}