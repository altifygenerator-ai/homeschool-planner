"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getChildren, getSavedWeeks } from "@/lib/plannerStorage";
import type { ChildProfile, SavedWeekLog } from "@/types/planner";

type ChildPortfolioDetailProps = {
  childId: string;
};

export default function ChildPortfolioDetail({
  childId,
}: ChildPortfolioDetailProps) {
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [nextSavedWeeks, nextChildren] = await Promise.all([
        getSavedWeeks(),
        getChildren(),
      ]);

      if (!isMounted) return;
      setSavedWeeks(nextSavedWeeks);
      setChildren(nextChildren);
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const child =
    children.find((item) => item.id === childId) ??
    savedWeeks
      .flatMap((week) => week.children)
      .find((item) => item.id === childId);

  const summaries = useMemo(() => {
    return savedWeeks.flatMap((week) =>
      week.childSummaries
        .filter((summary) => summary.childId === childId)
        .map((summary) => ({
          ...summary,
          weekLabel: week.weekLabel,
          savedAt: week.savedAt,
        }))
    );
  }, [childId, savedWeeks]);

  const relatedPlans = useMemo(() => {
    return savedWeeks.flatMap((week) =>
      week.plans
        .filter(
          (plan) => plan.assignedTo === childId || plan.assignedTo === "everyone"
        )
        .map((plan) => ({
          ...plan,
          weekLabel: week.weekLabel,
        }))
    );
  }, [childId, savedWeeks]);

  if (!child) {
    return (
      <div className="paper-card child-detail-card">
        <h1 className="section-title-sm">Child not found.</h1>
        <p className="text-soft">
          This child profile is not available right now. Go back to the children page.
        </p>
        <Link className="btn btn-secondary" href="/dashboard/children">
          Back to children
        </Link>
      </div>
    );
  }

  const completedTotal = summaries.reduce(
    (total, summary) => total + summary.completedCount,
    0
  );

  return (
    <div className="child-detail-layout">
      <section className="soft-card child-detail-hero">
        <p className="eyebrow">Child portfolio</p>
        <h1 className="section-title">{child.name}</h1>
        <p className="section-lead">
          A simple look at saved weekly rundowns and activities tied to this
          child.
        </p>

        <div className="dashboard-stat-row">
          <div>
            <strong>{summaries.length}</strong>
            <span>weeks</span>
          </div>
          <div>
            <strong>{completedTotal}</strong>
            <span>done</span>
          </div>
          <div>
            <strong>{relatedPlans.length}</strong>
            <span>records</span>
          </div>
          <div>
            <strong>{savedWeeks.length}</strong>
            <span>logs</span>
          </div>
        </div>
      </section>

      <section className="paper-card child-detail-card">
        <div>
          <p className="eyebrow">Weekly rundowns</p>
          <h2 className="section-title-sm">Saved notes over time</h2>
        </div>

        <div className="saved-week-list">
          {summaries.length ? (
            summaries.map((summary) => (
              <article
                className="child-summary-card"
                key={`${summary.childId}-${summary.weekLabel}`}
              >
                <h4>{summary.weekLabel}</h4>
                <p>{summary.summary}</p>

                <div className="pill-row">
                  <span className="pill pill-sage">
                    {summary.completedCount} done
                  </span>
                  <span className="pill pill-gold">
                    {summary.movedCount} moved
                  </span>
                  <span className="pill pill-clay">
                    {summary.skippedCount} skipped
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-day-card">
              <p>No saved weeks yet.</p>
              <span>Save a week from the planner to start this portfolio.</span>
            </div>
          )}
        </div>
      </section>

      <section className="paper-card child-detail-card">
        <div>
          <p className="eyebrow">Activity history</p>
          <h2 className="section-title-sm">Plans tied to {child.name}</h2>
        </div>

        <div className="saved-week-list">
          {relatedPlans.length ? (
            relatedPlans.map((plan) => (
              <article
                className="portfolio-activity-row"
                key={`${plan.id}-${plan.weekLabel}`}
              >
                <div>
                  <h4>{plan.title}</h4>
                  <p>{plan.weekLabel}</p>
                </div>

                <span>{plan.status}</span>
              </article>
            ))
          ) : (
            <div className="empty-day-card">
              <p>No activity history yet.</p>
              <span>Saved weekly records will show here later.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}