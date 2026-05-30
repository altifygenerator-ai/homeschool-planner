import ChildPortfolioDetail from "@/components/dashboard/ChildPortfolioDetail";
import DashboardShell from "@/components/dashboard/DashboardShell";

type ChildPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChildPage({ params }: ChildPageProps) {
  const { id } = await params;

  return (
    <DashboardShell>
      <ChildPortfolioDetail childId={id} />
    </DashboardShell>
  );
}