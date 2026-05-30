"use client";

import type { ChildProfile, SavedWeekLog } from "@/types/planner";

type ChildPortfolioPreviewProps = {
  children: ChildProfile[];
  savedWeeks: SavedWeekLog[];
};

export default function ChildPortfolioPreview({
  children,
  savedWeeks,
}: ChildPortfolioPreviewProps) {
  const realChildren = children.filter((child) => child.id !== "everyone");

  return (
    <section className="paper-card portfolio-preview-card">
      <div>
        <p className="eyebrow">Child portfolios</p>
        <h2 className="section-title-sm">A gentle record over time.</h2>
        <p className="text-soft">
          Each saved week can feed into a child’s portfolio, so the year becomes
          easier to look back on without extra busywork.
        </p>
      </div>

      <div className="portfolio-child-grid">
        {realChildren.map((child) => {
          const summaries = savedWeeks.flatMap((week) =>
            week.childSummaries.filter(
              (summary) => summary.childId === child.id
            )
          );

          const completedTotal = summaries.reduce(
            (total, summary) => total + summary.completedCount,
            0
          );

          return (
            <article className="portfolio-child-card" key={child.id}>
              <h3>{child.name}</h3>
              <p>
                {summaries.length
                  ? `${summaries.length} saved week${
                      summaries.length === 1 ? "" : "s"
                    } in the portfolio.`
                  : "No saved weeks yet."}
              </p>

              <div className="pill-row">
                <span className="pill pill-sage">
                  {completedTotal} completed
                </span>
                <span className="pill">Year view later</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}