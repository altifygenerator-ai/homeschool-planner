"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SavedWeeksView from "@/components/planner/SavedWeeksView";
import { deleteSavedWeek, getSavedWeeks } from "@/lib/plannerStorage";
import type { SavedWeekLog } from "@/types/planner";

export default function SavedWeeksPage() {
  const [savedWeeks, setSavedWeeks] = useState<SavedWeekLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadSavedWeeks() {
    setErrorMessage("");
    try {
      setSavedWeeks(await getSavedWeeks());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Weekly records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSavedWeeks();
  }, []);

  async function handleDeleteWeek(weekId: string) {
    setDeletingId(weekId);
    setErrorMessage("");
    try {
      await deleteSavedWeek(weekId);
      await loadSavedWeeks();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "That record could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardShell>
      <div className="dashboard-page-heading">
        <p className="sw-kicker">Records</p>
        <h1>What happened, without entering it twice.</h1>
        <p>Completed work, moved plans, notes, resources, and carry-forward history collect here automatically.</p>
      </div>
      {errorMessage ? (
        <div className="sw-error-banner" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void loadSavedWeeks()}>Try again</button>
        </div>
      ) : null}
      {loading ? (
        <section className="saved-weeks-card" aria-busy="true"><p>Loading weekly records…</p></section>
      ) : (
        <SavedWeeksView
          savedWeeks={savedWeeks}
          deletingId={deletingId}
          onDeleteWeek={(weekId) => void handleDeleteWeek(weekId)}
        />
      )}
    </DashboardShell>
  );
}
