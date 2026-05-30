import DashboardHome from "@/components/dashboard/DashboardHome";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHome />
    </DashboardShell>
  );
}