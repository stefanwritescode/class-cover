import { Icon, type NavItem } from "@/components/ui";

export function managerNav(active: "teachers" | "timetable" | "settings", toVet = 0): NavItem[] {
  return [
    { href: "/manage/teachers", label: "Teachers", active: active === "teachers", icon: Icon.people, badge: toVet },
    { href: "/manage/timetable", label: "Timetable", active: active === "timetable", icon: Icon.calendar },
    { href: "/manage/settings", label: "Settings", active: active === "settings", icon: Icon.sliders },
  ];
}
