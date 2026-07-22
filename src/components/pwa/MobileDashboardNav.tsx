"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LuArchive, LuCalendarDays, LuListChecks, LuPlus, LuUserRound, LuUsersRound } from "react-icons/lu";
import { getActiveAccountContext } from "@/lib/localAuth";

type MobileNavItem = {
  label: string;
  href: string;
  icon: typeof LuListChecks;
  view?: "today" | "week";
  add?: boolean;
};

const parentLinks: MobileNavItem[] = [
  { label: "Today", href: "/dashboard/planner?view=today", icon: LuListChecks, view: "today" },
  { label: "Week", href: "/dashboard/planner?view=week", icon: LuCalendarDays, view: "week" },
  { label: "Add", href: "/dashboard/planner?view=today&add=1", icon: LuPlus, add: true },
  { label: "Records", href: "/dashboard/weeks", icon: LuArchive },
  { label: "Family", href: "/dashboard/children", icon: LuUsersRound },
];

const childLinks: MobileNavItem[] = [
  { label: "Today", href: "/dashboard/planner?view=today", icon: LuListChecks, view: "today" },
  { label: "Week", href: "/dashboard/planner?view=week", icon: LuCalendarDays, view: "week" },
  { label: "Account", href: "/dashboard/account", icon: LuUserRound },
];

export default function MobileDashboardNav() {
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

  if (role === "loading") return null;
  const links = role === "child" ? childLinks : parentLinks;

  return (
    <nav className={`sw-mobile-nav ${role === "child" ? "is-child-nav" : ""}`} aria-label="Mobile application navigation">
      {links.map((item) => {
        const Icon = item.icon;
        const active = item.view
          ? pathname === "/dashboard/planner" && currentView === item.view && !searchParams.get("add")
          : item.add
            ? false
            : pathname.startsWith(item.href);
        return (
          <Link href={item.href} key={item.label} className={`${active ? "is-active" : ""} ${item.add ? "is-add" : ""}`}>
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
