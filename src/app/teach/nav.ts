import { Icon, type NavItem } from "@/components/ui";

export function teacherNav(active: "covers" | "earnings" | "profile", open = 0): NavItem[] {
  return [
    { href: "/teach", label: "Covers", active: active === "covers", icon: Icon.bell, badge: open },
    { href: "/teach/earnings", label: "Earnings", active: active === "earnings", icon: Icon.rand },
    { href: "/teach/profile", label: "Profile", active: active === "profile", icon: Icon.user },
  ];
}
