import ChildrenOverview from "@/components/dashboard/ChildrenOverview";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ChildrenPage() {
  return (
    <DashboardShell>
      <div className="dashboard-page-heading">
        <p className="eyebrow">Children</p>
        <h1 className="section-title">Each child gets a gentle record.</h1>
        <p className="section-lead">
          Add your children here, then assign plans to them in the weekly planner. Saved weeks will build a simple record for each child over time.
        </p>
      </div>

      <ChildrenOverview />
    </DashboardShell>
  );
}