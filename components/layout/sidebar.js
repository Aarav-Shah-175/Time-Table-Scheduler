"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, Users, BookOpen, ClipboardCheck, BarChart3, Settings, Home } from "lucide-react"

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/courses", label: "Course Management", icon: BookOpen },
  { href: "/admin/timetable", label: "Timetable", icon: Calendar },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

const facultyNavItems = [
  { href: "/faculty", label: "Dashboard", icon: Home },
  { href: "/faculty/timetable", label: "My Timetable", icon: Calendar },
  { href: "/faculty/attendance", label: "Mark Attendance", icon: ClipboardCheck },
  { href: "/faculty/courses", label: "My Courses", icon: BookOpen },
]

const studentNavItems = [
  { href: "/student", label: "Dashboard", icon: Home },
  { href: "/student/timetable", label: "My Timetable", icon: Calendar },
  { href: "/student/attendance", label: "My Attendance", icon: ClipboardCheck },
]

export function Sidebar({ role }) {
  const pathname = usePathname()

  let navItems = []
  if (role === "admin") navItems = adminNavItems
  else if (role === "faculty") navItems = facultyNavItems
  else if (role === "student") navItems = studentNavItems

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
