import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PrintRecordView from "@/components/print/PrintRecordView";

export default function PrintPage() {
  return (
    <DashboardShell>
      <Suspense
        fallback={
          <section className="paper-card print-loading-card">
            <p className="eyebrow">Print records</p>
            <h1 className="section-title-sm">Loading record...</h1>
          </section>
        }
      >
        <PrintRecordView />
      </Suspense>
    </DashboardShell>
  );
}
