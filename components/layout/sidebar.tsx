"use client"
import type { User } from "@/types"
import {
  BarChart3,
  Calendar,
  Users,
  FileText,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"

interface SidebarProps {
  user: User
  activeView: string
  setActiveView: (view: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  onLogout: () => void
}

export function Sidebar({
  user,
  activeView,
  setActiveView,
  sidebarCollapsed,
  setSidebarCollapsed,
  onLogout,
}: SidebarProps) {
  const getNavItems = () => {
    const commonItems = [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "timetable", label: "Timetable", icon: Calendar },
      { id: "attendance", label: "Attendance", icon: Users },
    ]

    const roleSpecificItems = {
      admin: [
        { id: "users", label: "Manage Users", icon: Users },
        { id: "reports", label: "Reports", icon: FileText },
      ],
      faculty: [{ id: "classes", label: "My Classes", icon: BookOpen }],
      student: [],
    }

    return [...commonItems, ...roleSpecificItems[user.role], { id: "settings", label: "Settings", icon: Settings }]
  }

  return (
    <div
      className={`${sidebarCollapsed ? "w-16" : "w-56"} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}
    >
      {/* Sidebar Header with Toggle */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!sidebarCollapsed && <h2 className="font-semibold text-gray-800">Navigation</h2>}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-2 space-y-1">
        {getNavItems().map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                activeView === item.id ? "bg-primary text-primary-foreground" : "text-gray-600 hover:bg-gray-100"
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="ml-3 truncate">{item.label}</span>}
            </button>
          )
        })}
      </div>

      <div className="p-2 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50"
          title={sidebarCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="ml-3 truncate">Logout</span>}
        </button>
      </div>
    </div>
  )
}
