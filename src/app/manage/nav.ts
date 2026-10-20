import type { NavItem } from "@/components/ui";

export function managerNav(active: "teachers" | "timetable" | "settings"): NavItem[] {
  return [
    { href: "/manage/teachers", label: "Teachers", active: active === "teachers" },
    { href: "/manage/timetable", label: "Timetable", active: active === "timetable" },
    { href: "/manage/settings", label: "Settings", active: active === "settings" },
  ];
}
