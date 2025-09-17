"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { dataService } from "@/lib/data-service"
import { authService } from "@/lib/auth"
import { Calendar, BookOpen, ClipboardCheck, TrendingUp } from "lucide-react"

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    todayClasses: 0,
    attendanceRate: 0,
    totalClasses: 0,
  })
  const [todaySchedule, setTodaySchedule] = useState([])
  const [recentAttendance, setRecentAttendance] = useState([])

  useEffect(() => {
    const user = authService.getCurrentUser()
    const courses = dataService.getCourses()
    const timetable = dataService.getTimetable()
    const attendance = dataService.getAttendance()

    // Get today's day name
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" })

    // Filter today's classes
    const todayClasses = timetable.filter((t) => t.day === today)

    // Get student's attendance records
    const myAttendance = attendance.filter((a) => a.studentId === user.id)

    // Calculate attendance rate
    const totalClasses = myAttendance.length
    const presentCount = myAttendance.filter((a) => a.status === "present").length
    const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0

    setStats({
      totalCourses: courses.length,
      todayClasses: todayClasses.length,
      attendanceRate,
      totalClasses,
    })

    // Set today's schedule with course details
    const scheduleWithDetails = todayClasses.map((t) => {
      const course = courses.find((c) => c.id === t.courseId)
      return { ...t, course }
    })
    setTodaySchedule(scheduleWithDetails)

    // Get recent attendance with course details
    const recentWithDetails = myAttendance
      .slice(-5)
      .reverse()
      .map((a) => {
        const course = courses.find((c) => c.id === a.courseId)
        return { ...a, course }
      })
    setRecentAttendance(recentWithDetails)
  }, [])

  const statCards = [
    {
      title: "Total Courses",
      value: stats.totalCourses,
      description: "Enrolled courses",
      icon: BookOpen,
      color: "text-chart-1",
    },
    {
      title: "Today's Classes",
      value: stats.todayClasses,
      description: "Classes scheduled today",
      icon: Calendar,
      color: "text-chart-2",
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      description: "Overall attendance",
      icon: TrendingUp,
      color: "text-chart-3",
    },
    {
      title: "Total Classes",
      value: stats.totalClasses,
      description: "Classes attended",
      icon: ClipboardCheck,
      color: "text-chart-4",
    },
  ]

  const getAttendanceBadge = (status) => {
    return status === "present" ? (
      <Badge className="bg-chart-1 text-white">Present</Badge>
    ) : (
      <Badge className="bg-destructive text-destructive-foreground">Absent</Badge>
    )
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">View your timetable and track your attendance</p>
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
              <CardTitle className="text-card-foreground">Today's Schedule</CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              {todaySchedule.length > 0 ? (
                <div className="space-y-4">
                  {todaySchedule.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {schedule.course?.code} - {schedule.course?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {schedule.startTime} - {schedule.endTime} | {schedule.room}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">{schedule.course?.credits} Credits</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No classes scheduled for today</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Recent Attendance</CardTitle>
              <CardDescription>Your latest attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttendance.length > 0 ? (
                <div className="space-y-4">
                  {recentAttendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {record.course?.code} - {record.course?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString()}</p>
                      </div>
                      {getAttendanceBadge(record.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No attendance records yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
            <CardDescription>Access your student features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/student/timetable"
                className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Calendar className="h-6 w-6 mb-2 text-primary" />
                <h3 className="font-semibold">View Timetable</h3>
                <p className="text-sm text-muted-foreground">Check your weekly class schedule</p>
              </a>
              <a
                href="/student/attendance"
                className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ClipboardCheck className="h-6 w-6 mb-2 text-primary" />
                <h3 className="font-semibold">My Attendance</h3>
                <p className="text-sm text-muted-foreground">View detailed attendance records</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
