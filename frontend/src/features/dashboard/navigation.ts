import { LayoutDashboardIcon, UserCogIcon, UsersIcon, type LucideIcon } from "lucide-react";

import type { Role } from "@/features/auth/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. The backend enforces access independently. */
  roles: readonly Role[];
}

/**
 * Sidebar navigation. Add an entry here when its page exists; items are
 * filtered by the signed-in user's role.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    roles: ["HR_MANAGER", "ADMIN"],
  },
  {
    title: "Employees",
    href: "/employees",
    icon: UsersIcon,
    roles: ["HR_MANAGER", "ADMIN"],
  },
  {
    title: "HR Managers",
    href: "/hr-managers",
    icon: UserCogIcon,
    roles: ["ADMIN"],
  },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
