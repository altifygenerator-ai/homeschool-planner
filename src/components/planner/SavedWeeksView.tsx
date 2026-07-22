"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LuCalendarDays, LuChevronDown, LuExternalLink, LuPrinter, LuSearch, LuTrash2 } from "react-icons/lu";
import type { PlannerItem, SavedWeekLog } from "@/types/planner";

type SavedWeeksViewProps = { savedWeeks: SavedWeekLog[]; deletingId?: string | null; onDeleteWeek?: (weekId: string) => void };
type SavedPlanItem = PlannerItem & { resourceUrl?: string; resourceTitle?: string; actualNotes?: string };

function dateOnly(value: string) { return value.slice(0, 10); }
function getMonthParam(value: string) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function getYearParam(value: string) { return String(new Date(value).getFullYear()); }
function formatMonth(value: string) { return new Date(`${value}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
function assignedName(week: SavedWeekLog, plan: SavedPlanItem) { return plan.assignedTo === "everyone" ? "Everyone" : week.children.find((child) => child.id === plan.assignedTo)?.name ?? "Child"; }
function statusLabel(status?: PlannerItem["status"]) { return status === "done" ? "Done" : status === "moved" ? "Moved" : status === "skipped" ? "Skipped" : "Planned"; }

export default function SavedWeeksView({ savedWeeks, deletingId = null, onDeleteWeek }: SavedWeeksViewProps) {
  const [query, setQuery] = useState("");
  const [childId, setChildId] = useState("all");
  const [category, setCategory] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const latestWeek = savedWeeks[0];
  const latestMonth = latestWeek ? getMonthParam(latestWeek.weekStart) : "";
  const latestYear = latestWeek ? getYearParam(latestWeek.weekStart) : "";

  const children = useMemo(() => {
    const found = new Map<string, string>();
    savedWeeks.forEach((week) => week.children.forEach((child) => { if (child.id !== "everyone") found.set(child.id, child.name); }));
    return [...found.entries()];
  }, [savedWeeks]);

  const categories = useMemo(() => [...new Set(savedWeeks.flatMap((week) => week.plans.map((plan) => plan.category)).filter(Boolean))].sort(), [savedWeeks]);

  const results = useMemo(() => savedWeeks.map((week) => {
    const weekDate = dateOnly(week.weekStart);
    const inDateRange = (!fromDate || weekDate >= fromDate) && (!toDate || weekDate <= toDate);
    const plans = inDateRange ? week.plans.filter((plan) => {
      const matchesQuery = !query.trim() || `${plan.title} ${plan.notes ?? ""} ${plan.actualNotes ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
      const matchesChild = childId === "all" || plan.assignedTo === childId || plan.assignedTo === "everyone";
      const matchesCategory = category === "all" || plan.category === category;
      return matchesQuery && matchesChild && matchesCategory;
    }) : [];
    return { week, plans };
  }).filter(({ plans }) => plans.length || (!query && childId === "all" && category === "all" && !fromDate && !toDate)), [category, childId, fromDate, query, savedWeeks, toDate]);

  if (!savedWeeks.length) {
    return <section className="saved-weeks-card"><h2>No records yet.</h2><p className="text-soft">Planning and completing work automatically builds the weekly record. There is no separate save step.</p><Link className="btn btn-primary" href="/dashboard/planner?view=week">Open this week</Link></section>;
  }

  return (
    <section className="saved-weeks-card">
      <div className="saved-weeks-topline">
        <div><p className="sw-kicker">Records</p><h2>Your family’s work, already collected.</h2><p>Search what was planned or completed, then print a week, month, or year. Records update from normal planner use.</p></div>
        <div className="record-print-actions">
          {latestMonth ? <Link className="soft-action soft-action-filled" href={`/dashboard/print?period=month&month=${latestMonth}`}><LuCalendarDays />Print {formatMonth(latestMonth)}</Link> : null}
          {latestYear ? <Link className="soft-action" href={`/dashboard/print?period=year&year=${latestYear}`}><LuPrinter />Print {latestYear}</Link> : null}
        </div>
      </div>

      <div className="sw-record-filters" aria-label="Record filters">
        <label className="sw-record-search"><LuSearch aria-hidden="true" /><span className="sr-only">Search records</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lesson or note" /></label>
        <label><span>Child</span><select value={childId} onChange={(event) => setChildId(event.target.value)}><option value="all">All children</option>{children.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
        <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label><span>From</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label><span>To</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
      </div>

      {!results.length ? <div className="sw-empty-line">No saved work matches those filters.</div> : null}
      <div className="saved-week-list">
        {results.map(({ week, plans }) => (
          <article className="saved-week-item" key={week.id}>
            <div className="saved-week-header">
              <div><h3>{week.weekLabel}</h3><p>{week.closedAt ? "Closed" : "Updated"} {new Date(week.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>{week.familyNote ? <p className="sw-family-note">{week.familyNote}</p> : null}</div>
              <div className="saved-week-actions"><span>{plans.length} matching {plans.length === 1 ? "item" : "items"}</span><Link className="print-week-button" href={`/dashboard/print?period=week&weekStart=${dateOnly(week.weekStart)}`}><LuPrinter />Print</Link>{onDeleteWeek ? <button className="delete-week-button" type="button" disabled={deletingId === week.id} onClick={() => onDeleteWeek(week.id)} aria-label={`Delete record ${week.weekLabel}`}><LuTrash2 />{deletingId === week.id ? "Deleting…" : "Delete"}</button> : null}</div>
            </div>

            <div className="child-summary-list">{week.childSummaries.map((summary) => <div className="child-summary-card" key={summary.childId}><h4>{summary.childName}</h4><p>{summary.summary}</p><div className="pill-row"><span className="pill pill-sage">{summary.completedCount} done</span><span className="pill pill-gold">{summary.movedCount} moved</span><span className="pill pill-clay">{summary.skippedCount} skipped</span></div></div>)}</div>

            <details className="saved-week-detail" open={Boolean(query || childId !== "all" || category !== "all")}>
              <summary className="saved-week-detail-toggle"><span><LuChevronDown />View work</span><small>{plans.length} items</small></summary>
              <div className="saved-plan-list">
                {plans.map((savedPlan) => {
                  const plan = savedPlan as SavedPlanItem;
                  const status = plan.status ?? "planned";
                  return <div className="saved-plan-card" key={plan.id}>
                    <div className="saved-plan-card-top"><div><p className="saved-plan-day">{plan.placement === "week" || !plan.day ? "This Week" : plan.day}{plan.actualDate ? ` · completed ${new Date(`${plan.actualDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</p><h4>{plan.title}</h4></div><span className={`saved-plan-status saved-plan-status-${status}`}>{statusLabel(status)}</span></div>
                    <div className="saved-plan-meta"><span>{assignedName(week, plan)}</span><span>{plan.timeBlock}</span><span>{plan.category}</span>{plan.timeSpentMinutes ? <span>{plan.timeSpentMinutes} min</span> : null}</div>
                    {plan.notes || plan.actualNotes ? <div className="saved-plan-notes">{plan.notes ? <p><strong>Plan note:</strong> {plan.notes}</p> : null}{plan.actualNotes ? <p><strong>What happened:</strong> {plan.actualNotes}</p> : null}</div> : null}
                    {plan.resourceUrl ? <a className="saved-plan-resource" href={plan.resourceUrl} target="_blank" rel="noreferrer"><LuExternalLink />{plan.resourceTitle || "Open resource"}</a> : null}
                  </div>;
                })}
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
