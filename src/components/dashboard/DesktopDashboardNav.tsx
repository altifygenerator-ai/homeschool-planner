"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getActiveAccountContext } from "@/lib/localAuth";

const parentLinks = [
  { label: "Today", href: "/dashboard/planner?view=today", view: "today" },
  { label: "Week", href: "/dashboard/planner?view=week", view: "week" },
  { label: "Records", href: "/dashboard/weeks" },
  { label: "Family", href: "/dashboard/children" },
];

const childLinks = [
  { label: "Today", href: "/dashboard/planner?view=today", view: "today" },
  { label: "Week", href: "/dashboard/planner?view=week", view: "week" },
  { label: "Account", href: "/dashboard/account" },
];

export default function DesktopDashboardNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") ?? "today";
  const [role, setRole] = useState<"loading" | "parent" | "child">("loading");

  useEffect(() => {
    let mounted = true;
    void getActiveAccountContext()
      .then((context) => {
        if (mounted) setRole(context?.isChild ? "child" : "parent");
      })
      .catch(() => {
        if (mounted) setRole("parent");
      });
    return () => { mounted = false; };
  }, []);

  if (role === "loading") {
    return <div className="sw-desktop-nav-placeholder" aria-hidden="true" />;
  }

  const links = role === "child" ? childLinks : parentLinks;

  return (
    <nav className="sw-desktop-nav" aria-label="Primary application navigation">
      {links.map((item) => {
        const active = item.view
          ? pathname === "/dashboard/planner" && currentView === item.view && !searchParams.get("add")
          : pathname.startsWith(item.href);

        return (
          <Link href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
      {role === "parent" ? <Link className="sw-nav-add" href="/dashboard/planner?view=today&add=1">Add</Link> : null}
    </nav>
  );
}
