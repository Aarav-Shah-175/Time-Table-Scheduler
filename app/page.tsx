"use client"

import { useState } from "react"
import type { User } from "@/types"
import { mockUsers } from "@/data/mock-data"
import { LoginPage } from "@/components/auth/login-page"
import { Sidebar } from "@/components/layout/sidebar"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { FacultyDashboard } from "@/components/dashboard/faculty-dashboard"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { TimetableView } from "@/components/timetable/timetable-view"
import { FacultyAttendance } from "@/components/attendance/faculty-attendance"
import { StudentAttendance } from "@/components/attendance/student-attendance"
import { UserManagement } from "@/components/admin/user-management"
import { ReportsView } from "@/components/admin/reports-view"
import { MyClasses } from "@/components/faculty/my-classes"
import { SettingsView } from "@/components/settings/settings-view"

export default function CollegeTimetableApp() {
  const [user, setUser] = useState<User | null>(null)
  const [activeView, setActiveView] = useState("dashboard")
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogin = (email: string, password: string, role: "admin" | "faculty" | "student") => {
    const user = mockUsers.find((u) => u.email === email && u.password === password && u.role === role)
    if (user) {
      setUser(user)
    } else {
      alert("Invalid credentials")
    }
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  const renderContent = () => {
    switch (activeView) {
      case "timetable":
        return <TimetableView user={user} selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
      case "attendance":
        return user.role === "faculty" ? <FacultyAttendance user={user} /> : <StudentAttendance user={user} />
      case "users":
        return user.role === "admin" ? <UserManagement /> : <div>Access Denied</div>
      case "reports":
        return user.role === "admin" ? <ReportsView /> : <div>Access Denied</div>
      case "classes":
        return user.role === "faculty" ? <MyClasses user={user} /> : <div>Access Denied</div>
      case "settings":
        return <SettingsView user={user} />
      default:
        return getDashboardContent()
    }
  }

  const getDashboardContent = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard />
      case "faculty":
        return <FacultyDashboard />
      case "student":
        return <StudentDashboard />
      default:
        return <div>Invalid role</div>
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onLogout={handleLogout}
      />
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  )
}
