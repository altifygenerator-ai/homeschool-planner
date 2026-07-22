import DashboardShell from "@/components/dashboard/DashboardShell";
import PlannerShell from "@/components/planner/PlannerShell";

type PlannerPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPlannerPage({ searchParams }: PlannerPageProps) {
  const params = await searchParams;
  const requestedView = first(params.view);
  const initialView = requestedView === "week" ? "week" : "today";
  const initialAdd = first(params.add) === "1";
  const initialCloseout = first(params.closeout) === "1";
  const initialReminder = first(params.reminder) ?? null;

  return (
    <DashboardShell>
      <PlannerShell
        key={`${initialView}:${initialAdd ? "add" : "plain"}:${initialCloseout ? "closeout" : "open"}:${initialReminder ?? "none"}`}
        initialView={initialView}
        initialAdd={initialAdd}
        initialCloseout={initialCloseout}
        initialReminder={initialReminder}
      />
    </DashboardShell>
  );
}
