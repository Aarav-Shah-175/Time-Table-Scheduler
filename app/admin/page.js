"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dataService } from "@/lib/data-service"
import { Users, BookOpen, Calendar, ClipboardCheck } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalClasses: 0,
    attendanceRate: 0,
  })

  useEffect(() => {
    const users = dataService.getUsers()
    const courses = dataService.getCourses()
    const timetable = dataService.getTimetable()
    const attendance = dataService.getAttendance()

    // Calculate attendance rate
    const totalAttendance = attendance.length
    const presentCount = attendance.filter((a) => a.status === "present").length
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

    setStats({
      totalUsers: users.length,
      totalCourses: courses.length,
      totalClasses: timetable.length,
      attendanceRate,
    })
  }, [])

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Students, Faculty & Admins",
      icon: Users,
      color: "text-chart-1",
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      description: "Active courses this semester",
      icon: BookOpen,
      color: "text-chart-2",
    },
    {
      title: "Scheduled Classes",
      value: stats.totalClasses,
      description: "Classes in timetable",
      icon: Calendar,
      color: "text-chart-3",
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      description: "Overall attendance",
      icon: ClipboardCheck,
      color: "text-chart-4",
    },
  ]

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your college timetable and attendance system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="/admin/users"
                  className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Users className="h-6 w-6 mb-2 text-primary" />
                  <h3 className="font-semibold">Manage Users</h3>
                  <p className="text-sm text-muted-foreground">Add, edit, or remove users</p>
                </a>
                <a
                  href="/admin/timetable"
                  className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Calendar className="h-6 w-6 mb-2 text-primary" />
                  <h3 className="font-semibold">Timetable</h3>
                  <p className="text-sm text-muted-foreground">Manage class schedules</p>
                </a>
                <a
                  href="/admin/courses"
                  className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <BookOpen className="h-6 w-6 mb-2 text-primary" />
                  <h3 className="font-semibold">Courses</h3>
                  <p className="text-sm text-muted-foreground">Manage course catalog</p>
                </a>
                <a
                  href="/admin/reports"
                  className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <ClipboardCheck className="h-6 w-6 mb-2 text-primary" />
                  <h3 className="font-semibold">Reports</h3>
                  <p className="text-sm text-muted-foreground">View attendance reports</p>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Recent Activity</CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New student registered</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Timetable updated for CS101</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Attendance marked for Monday classes</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
