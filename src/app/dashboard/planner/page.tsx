import DashboardShell from "@/components/dashboard/DashboardShell";
import PlannerShell from "@/components/planner/PlannerShell";

export default function DashboardPlannerPage() {
  return (
    <DashboardShell>
      <PlannerShell />
    </DashboardShell>
  );
}