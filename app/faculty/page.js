"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dataService } from "@/lib/data-service"
import { authService } from "@/lib/auth"
import { Calendar, BookOpen, ClipboardCheck, Users } from "lucide-react"

export default function FacultyDashboard() {
  const [stats, setStats] = useState({
    myCourses: 0,
    todayClasses: 0,
    totalStudents: 0,
    pendingAttendance: 0,
  })
  const [todaySchedule, setTodaySchedule] = useState([])

  useEffect(() => {
    const user = authService.getCurrentUser()
    const courses = dataService.getCourses().filter((c) => c.facultyId === user.id)
    const timetable = dataService.getTimetable()
    const users = dataService.getUsers()
    const attendance = dataService.getAttendance()

    // Get today's day name
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" })

    // Filter today's classes for this faculty
    const todayClasses = timetable.filter((t) => {
      const course = courses.find((c) => c.id === t.courseId)
      return course && t.day === today
    })

    // Calculate stats
    const totalStudents = users.filter((u) => u.role === "student").length
    const pendingAttendance = todayClasses.length // Simplified - assume all today's classes need attendance

    setStats({
      myCourses: courses.length,
      todayClasses: todayClasses.length,
      totalStudents,
      pendingAttendance,
    })

    // Set today's schedule with course details
    const scheduleWithDetails = todayClasses.map((t) => {
      const course = courses.find((c) => c.id === t.courseId)
      return { ...t, course }
    })
    setTodaySchedule(scheduleWithDetails)
  }, [])

  const statCards = [
    {
      title: "My Courses",
      value: stats.myCourses,
      description: "Courses assigned to me",
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
      title: "Total Students",
      value: stats.totalStudents,
      description: "Students in the system",
      icon: Users,
      color: "text-chart-3",
    },
    {
      title: "Pending Attendance",
      value: stats.pendingAttendance,
      description: "Classes needing attendance",
      icon: ClipboardCheck,
      color: "text-chart-4",
    },
  ]

  return (
    <DashboardLayout role="faculty">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Faculty Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and track student attendance</p>
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
                      <a href="/faculty/attendance" className="text-primary hover:text-primary/80 text-sm font-medium">
                        Mark Attendance
                      </a>
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
              <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
              <CardDescription>Common faculty tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <a
                  href="/faculty/timetable"
                  className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Calendar className="h-6 w-6 mb-2 text-primary" />
                  <h3 className="font-semibold">View Timetable</h3>
                  <p className="text-sm text-muted-foreground">Check your weekly schedule</p>
                </a>
                <a
                  href="/faculty/attendance"
                  className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <ClipboardCheck className="h-6 w-6 mb-2 text-primary" />
                  <h3 className="font-semibold">Mark Attendance</h3>
                  <p className="text-sm text-muted-foreground">Record student attendance</p>
                </a>
                <a
                  href="/faculty/courses"
                  className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <BookOpen className="h-6 w-6 mb-2 text-primary" />
                  <h3 className="font-semibold">My Courses</h3>
                  <p className="text-sm text-muted-foreground">View assigned courses</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
