"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SavedWeeksView from "@/components/planner/SavedWeeksView";
import { deleteSavedWeek, getSavedWeeks } from "@/lib/plannerStorage";
import type { SavedWeekLog } from "@/types/planner";

export default function SavedWeeksPage() {
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSavedWeeks(getSavedWeeks()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function handleDeleteWeek(weekId: string) {
    deleteSavedWeek(weekId);
    setSavedWeeks(getSavedWeeks());
  }

  return (
    <DashboardShell>
      <div className="dashboard-page-heading">
        <p className="eyebrow">Saved weeks</p>
        <h1 className="section-title">Look back without digging around.</h1>
        <p className="section-lead">
          Saved weeks collect the plans, notes, and child rundowns from each
          week so the year can build naturally over time.
        </p>
      </div>

      <SavedWeeksView
        savedWeeks={savedWeeks}
        onDeleteWeek={handleDeleteWeek}
      />
    </DashboardShell>
  );
}