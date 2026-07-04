"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LuArrowLeft, LuPrinter } from "react-icons/lu";
import { getCategoryLabel, weekDays } from "@/data/demoPlans";
import { getCategoryDefinitions, getChildren, getPlansForWeek, getSavedWeeks } from "@/lib/plannerStorage";
import { getCurrentWeekRange, getWeekRangeFromStart } from "@/lib/week";
import { generateChildWeeklySummaries } from "@/lib/weeklySummary";
import type { CategoryDefinition, ChildProfile, PlannerItem, SavedWeekLog } from "@/types/planner";

type PrintPeriod = "week" | "month" | "year";

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getMonthParam(value: string) {
  return `${new Date(value).getFullYear()}-${String(new Date(value).getMonth() + 1).padStart(2, "0")}`;
}

function getYearParam(value: string) {
  return String(new Date(value).getFullYear());
}

function labelForMonth(value: string) {
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function childName(children: ChildProfile[], childId: string) {
  if (childId === "everyone") return "Everyone";
  return children.find((child) => child.id === childId)?.name ?? "Child";
}

function statsForPlans(plans: PlannerItem[]) {
  return {
    planned: plans.filter((plan) => plan.status === "planned").length,
    done: plans.filter((plan) => plan.status === "done").length,
    moved: plans.filter((plan) => plan.status === "moved").length,
    skipped: plans.filter((plan) => plan.status === "skipped").length,
  };
}

function sortSavedWeeks(savedWeeks: SavedWeekLog[]) {
  return [...savedWeeks].sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
  );
}

export default function PrintRecordView() {
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") as PrintPeriod | null) ?? "week";
  const requestedWeekStart = searchParams.get("weekStart") ?? getCurrentWeekRange().weekStart;
  const requestedMonth = searchParams.get("month") ?? getMonthParam(requestedWeekStart);
  const requestedYear = searchParams.get("year") ?? getYearParam(requestedWeekStart);

  const [plans, setPlans] = useState<PlannerItem[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const normalizedWeekStart = requestedWeekStart.slice(0, 10);
  const weekRange = useMemo(() => getWeekRangeFromStart(normalizedWeekStart), [normalizedWeekStart]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [nextPlans, nextChildren, nextCategories, nextSavedWeeks] = await Promise.all([
        getPlansForWeek(normalizedWeekStart),
        getChildren(),
        getCategoryDefinitions(),
        getSavedWeeks(),
      ]);

      if (!isMounted) return;
      setPlans(nextPlans);
      setChildren(nextChildren);
      setCategories(nextCategories);
      setSavedWeeks(nextSavedWeeks);
      setHasLoaded(true);
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [normalizedWeekStart]);

  const savedWeekForPrint = useMemo(() => {
    return savedWeeks.find((week) => dateOnly(week.weekStart) === dateOnly(normalizedWeekStart));
  }, [normalizedWeekStart, savedWeeks]);

  const weeklyPlans = savedWeekForPrint?.plans.length ? savedWeekForPrint.plans : plans;
  const printableChildren = savedWeekForPrint?.children.length ? savedWeekForPrint.children : children;
  const weeklySummaries = savedWeekForPrint?.childSummaries.length
    ? savedWeekForPrint.childSummaries
    : generateChildWeeklySummaries(printableChildren, weeklyPlans);

  const monthlyWeeks = useMemo(() => {
    return sortSavedWeeks(savedWeeks).filter((week) => getMonthParam(week.weekStart) === requestedMonth);
  }, [requestedMonth, savedWeeks]);

  const yearlyWeeks = useMemo(() => {
    return sortSavedWeeks(savedWeeks).filter((week) => getYearParam(week.weekStart) === requestedYear);
  }, [requestedYear, savedWeeks]);

  const printTitle =
    period === "month"
      ? `${labelForMonth(requestedMonth)} record`
      : period === "year"
        ? `${requestedYear} record`
        : `${weekRange.weekLabel} weekly record`;

  function renderWeekDetails(recordPlans: PlannerItem[], recordChildren: ChildProfile[]) {
    const stats = statsForPlans(recordPlans);

    return (
      <>
        <div className="print-stat-row">
          <div><strong>{recordPlans.length}</strong><span>Total plans</span></div>
          <div><strong>{stats.done}</strong><span>Done</span></div>
          <div><strong>{stats.moved}</strong><span>Moved</span></div>
          <div><strong>{stats.skipped}</strong><span>Skipped</span></div>
        </div>

        <div className="print-day-list">
          {weekDays.map((day) => {
            const dayPlans = recordPlans.filter((plan) => plan.day === day);

            return (
              <section className="print-day-section" key={day}>
                <h3>{day}</h3>
                {dayPlans.length ? (
                  dayPlans.map((plan) => (
                    <article className="print-plan-row" key={plan.id}>
                      <div>
                        <strong>{plan.title}</strong>
                        <p>
                          {getCategoryLabel(plan.category, categories)} · {plan.timeBlock} · For {childName(recordChildren, plan.assignedTo)}
                        </p>
                        {plan.notes ? <p className="print-plan-note">Plan note: {plan.notes}</p> : null}
                        {plan.actualNotes ? <p className="print-plan-note">What happened: {plan.actualNotes}</p> : null}
                        {plan.resourceUrl ? (
                          <p className="print-plan-note">Resource: {plan.resourceTitle || "Link"} · {plan.resourceUrl}</p>
                        ) : null}
                      </div>
                      <span>{plan.status}</span>
                    </article>
                  ))
                ) : (
                  <p className="print-empty-line">Open day / no saved plans.</p>
                )}
              </section>
            );
          })}
        </div>
      </>
    );
  }

  function renderWeeklyRecord() {
    return (
      <section className="print-record-sheet">
        <div className="print-sheet-top">
          <div>
            <p>SoftWeek Planner</p>
            <h1>Weekly homeschool record</h1>
            <span>{formatFullDate(weekRange.weekStart)} - {formatFullDate(weekRange.weekEnd)}</span>
          </div>
          <div className="print-folder-note">Printed for notebook or folder records</div>
        </div>

        {weeklySummaries.length ? (
          <section className="print-summary-section">
            <h2>Child rundown</h2>
            <div className="print-summary-grid">
              {weeklySummaries.map((summary) => (
                <article key={summary.childId}>
                  <strong>{summary.childName}</strong>
                  <p>{summary.summary}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {renderWeekDetails(weeklyPlans, printableChildren)}

        <section className="print-parent-notes">
          <h2>Parent notes</h2>
          <div />
          <div />
          <div />
        </section>
      </section>
    );
  }

  function renderGroupedRecords(records: SavedWeekLog[], title: string, subtitle: string) {
    const totalPlans = records.reduce((total, week) => total + week.plans.length, 0);
    const stats = statsForPlans(records.flatMap((week) => week.plans));

    return (
      <section className="print-record-sheet">
        <div className="print-sheet-top">
          <div>
            <p>SoftWeek Planner</p>
            <h1>{title}</h1>
            <span>{subtitle}</span>
          </div>
          <div className="print-folder-note">Printed for notebook or folder records</div>
        </div>

        <div className="print-stat-row">
          <div><strong>{records.length}</strong><span>Saved weeks</span></div>
          <div><strong>{totalPlans}</strong><span>Total plans</span></div>
          <div><strong>{stats.done}</strong><span>Done</span></div>
          <div><strong>{stats.moved}</strong><span>Moved</span></div>
        </div>

        {records.length ? (
          <div className="print-record-list">
            {records.map((week) => (
              <section className="print-record-week" key={week.id}>
                <div className="print-record-week-header">
                  <h2>{week.weekLabel}</h2>
                  <span>{formatShortDate(week.weekStart)} - {formatShortDate(week.weekEnd)}</span>
                </div>
                <div className="print-summary-grid">
                  {week.childSummaries.length ? (
                    week.childSummaries.map((summary) => (
                      <article key={summary.childId}>
                        <strong>{summary.childName}</strong>
                        <p>{summary.summary}</p>
                      </article>
                    ))
                  ) : (
                    <article>
                      <strong>Saved record</strong>
                      <p>{week.plans.length} plans saved for this week.</p>
                    </article>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="print-empty-line">No saved records found for this period yet.</p>
        )}

        <section className="print-parent-notes">
          <h2>Parent notes</h2>
          <div />
          <div />
          <div />
        </section>
      </section>
    );
  }

  if (!hasLoaded) {
    return (
      <section className="paper-card print-loading-card">
        <p className="eyebrow">Print records</p>
        <h1 className="section-title-sm">Loading your record...</h1>
      </section>
    );
  }

  return (
    <div className="print-record-page">
      <section className="soft-card print-action-panel no-print">
        <div>
          <p className="eyebrow">Print records</p>
          <h1 className="section-title-sm">{printTitle}</h1>
          <p className="text-small">
            Print this record for a folder, binder, or homeschool notebook. You can also use your browser’s save as PDF option.
          </p>
        </div>

        <div className="print-action-buttons">
          <Link className="btn btn-secondary" href="/dashboard/weeks">
            <LuArrowLeft />
            Back to records
          </Link>
          <button className="btn btn-primary" type="button" onClick={() => window.print()}>
            <LuPrinter />
            Print record
          </button>
        </div>
      </section>

      {period === "month"
        ? renderGroupedRecords(monthlyWeeks, `${labelForMonth(requestedMonth)} homeschool record`, "Month-to-month overview from saved weeks")
        : period === "year"
          ? renderGroupedRecords(yearlyWeeks, `${requestedYear} homeschool record`, "Year overview from saved weeks")
          : renderWeeklyRecord()}
    </div>
  );
}
