"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight, LuUserRound } from "react-icons/lu";
import { demoChildren } from "@/data/demoChildren";
import { getSavedWeeks } from "@/lib/plannerStorage";
import type { SavedWeekLog } from "@/types/planner";

export default function ChildrenOverview() {
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);

  useEffect(() => {
    setSavedWeeks(getSavedWeeks());
  }, []);

  const realChildren = demoChildren.filter((child) => child.id !== "everyone");

  return (
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
          <Link
            className="child-profile-card paper-card"
            href={`/dashboard/children/${child.id}`}
            key={child.id}
          >
            <div className="child-profile-icon">
              <LuUserRound />
            </div>

            <div>
              <h2>{child.name}</h2>
              <p>
                {summaries.length
                  ? `${summaries.length} saved week${
                      summaries.length === 1 ? "" : "s"
                    } in this portfolio.`
                  : "No saved weeks yet."}
              </p>
            </div>

            <div className="pill-row">
              <span className="pill pill-sage">
                {completedTotal} completed
              </span>
              <span className="pill">View portfolio</span>
            </div>

            <span className="child-profile-arrow">
              <LuArrowRight />
            </span>
          </Link>
        );
      })}
    </div>
  );
}