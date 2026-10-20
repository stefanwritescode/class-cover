import { Icon, type NavItem } from "@/components/ui";

export type ManagerTab = "covers" | "post" | "teachers" | "pay" | "settings";

export function managerNav(active: ManagerTab, badges: { toVet?: number; open?: number } = {}): NavItem[] {
  return [
    { href: "/manage/covers", label: "Covers", active: active === "covers", icon: Icon.bell, badge: badges.open },
    { href: "/manage/post", label: "Post", active: active === "post", icon: Icon.plus },
    { href: "/manage/teachers", label: "Teachers", active: active === "teachers", icon: Icon.people, badge: badges.toVet },
    { href: "/manage/pay", label: "Pay", active: active === "pay", icon: Icon.rand },
    { href: "/manage/settings", label: "Settings", active: active === "settings", icon: Icon.sliders },
  ];
}
