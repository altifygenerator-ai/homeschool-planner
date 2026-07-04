"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SavedWeeksView from "@/components/planner/SavedWeeksView";
import { deleteSavedWeek, getSavedWeeks } from "@/lib/plannerStorage";
import type { SavedWeekLog } from "@/types/planner";

export default function SavedWeeksPage() {
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);

  async function loadSavedWeeks() {
    setSavedWeeks(await getSavedWeeks());
  }

  useEffect(() => {
    let isMounted = true;

    getSavedWeeks().then((nextSavedWeeks) => {
      if (isMounted) setSavedWeeks(nextSavedWeeks);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDeleteWeek(weekId: string) {
    await deleteSavedWeek(weekId);
    await loadSavedWeeks();
  }

  return (
    <DashboardShell>
      <div className="dashboard-page-heading">
        <p className="eyebrow">Saved weeks</p>
        <h1 className="section-title">Records without digging around.</h1>
        <p className="section-lead">
          Saved weeks collect plans, notes, resource links, and child rundowns so
          you can print clean weekly, monthly, or yearly records for a notebook
          or folder.
        </p>
      </div>

      <SavedWeeksView savedWeeks={savedWeeks} onDeleteWeek={(weekId) => void handleDeleteWeek(weekId)} />
    </DashboardShell>
  );
}
