"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { startGuestSession } from "@/lib/localAuth";

export default function GuestPage() {
  const router = useRouter();

  useEffect(() => {
    startGuestSession();
    router.replace("/dashboard/planner?view=today");
  }, [router]);

  return (
    <main className="site-shell">
      <section className="section">
        <div className="container section-center">
          <p className="eyebrow">Opening guest planner</p>
          <h1 className="section-title">Getting your planner ready.</h1>
          <p className="section-lead">
            SoftWeek is opening in guest mode so you can try the planner first.
          </p>
        </div>
      </section>
    </main>
  );
}
