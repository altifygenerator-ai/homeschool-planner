import ChildrenOverview from "@/components/dashboard/ChildrenOverview";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ChildrenPage() {
  return (
    <DashboardShell>
      <div className="dashboard-page-heading">
        <p className="eyebrow">Children</p>
        <h1 className="section-title">Each child gets a gentle record.</h1>
        <p className="section-lead">
          Child profiles will eventually hold saved weeks, activity history,
          notes, and portfolio records. For now, this demo pulls from saved
          local week logs.
        </p>
      </div>

      <ChildrenOverview />
    </DashboardShell>
  );
}