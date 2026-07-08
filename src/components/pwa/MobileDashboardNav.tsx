"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuArchive,
  LuCalendarDays,
  LuHouse,
  LuUserRound,
  LuUsersRound,
} from "react-icons/lu";

const mobileLinks = [
  { label: "Home", href: "/dashboard", icon: LuHouse },
  { label: "Planner", href: "/dashboard/planner", icon: LuCalendarDays },
  { label: "Saved", href: "/dashboard/weeks", icon: LuArchive },
  { label: "Kids", href: "/dashboard/children", icon: LuUsersRound },
  { label: "Account", href: "/dashboard/account", icon: LuUserRound },
];

export default function MobileDashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-dashboard-nav" aria-label="Mobile dashboard navigation">
      {mobileLinks.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link className={isActive ? "is-active" : ""} href={item.href} key={item.href}>
            <Icon />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
