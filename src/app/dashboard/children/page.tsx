import ChildrenOverview from "@/components/dashboard/ChildrenOverview";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ChildrenPage() {
  return (
    <DashboardShell>
      <div className="dashboard-page-heading">
        <p className="eyebrow">Children</p>
        <h1 className="section-title">Profiles, portfolios, and optional child accounts.</h1>
        <p className="section-lead">
          Add the children you plan for, assign weekly plans to them, and create
          a limited account for older kids when you want them to help mark work
          done without changing the whole family planner.
        </p>
      </div>

      <ChildrenOverview />
    </DashboardShell>
  );
}
