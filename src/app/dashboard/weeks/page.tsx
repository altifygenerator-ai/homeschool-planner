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
        <h1 className="section-title">Records without digging around.</h1>
        <p className="section-lead">
          Saved weeks collect plans, notes, and child rundowns so SoftWeek can
          grow into printable records, child portfolios, exports, and backed-up
          homeschool history.
        </p>
      </div>

      <SavedWeeksView savedWeeks={savedWeeks} onDeleteWeek={handleDeleteWeek} />
    </DashboardShell>
  );
}
