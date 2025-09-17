"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dataService } from "@/lib/data-service"
import { authService } from "@/lib/auth"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState([])
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    const user = authService.getCurrentUser()
    const allAttendance = dataService.getAttendance()
    const myAttendance = allAttendance.filter((a) => a.studentId === user.id)
    setAttendance(myAttendance)

    const allCourses = dataService.getCourses()
    setCourses(allCourses)

    // Calculate attendance stats per course
    const courseStats = {}
    allCourses.forEach((course) => {
      const courseAttendance = myAttendance.filter((a) => a.courseId === course.id)
      const total = courseAttendance.length
      const present = courseAttendance.filter((a) => a.status === "present").length
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0

      courseStats[course.id] = {
        total,
        present,
        absent: total - present,
        percentage,
      }
    })
    setStats(courseStats)
  }, [])

  const getCourseById = (id) => {
    return courses.find((c) => c.id === id)
  }

  const getAttendanceBadge = (status) => {
    return status === "present" ? (
      <Badge className="bg-chart-1 text-white">Present</Badge>
    ) : (
      <Badge className="bg-destructive text-destructive-foreground">Absent</Badge>
    )
  }

  const getPercentageBadge = (percentage) => {
    if (percentage >= 75) {
      return <Badge className="bg-chart-1 text-white">{percentage}%</Badge>
    } else if (percentage >= 60) {
      return <Badge className="bg-chart-3 text-white">{percentage}%</Badge>
    } else {
      return <Badge className="bg-destructive text-destructive-foreground">{percentage}%</Badge>
    }
  }

  const getPercentageIcon = (percentage) => {
    if (percentage >= 75) {
      return <TrendingUp className="h-4 w-4 text-chart-1" />
    } else if (percentage >= 60) {
      return <Minus className="h-4 w-4 text-chart-3" />
    } else {
      return <TrendingDown className="h-4 w-4 text-destructive" />
    }
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
          <p className="text-muted-foreground">Track your attendance across all courses</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Attendance Summary</CardTitle>
            <CardDescription>Your attendance percentage by course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => {
                const courseStat = stats[course.id] || { total: 0, present: 0, absent: 0, percentage: 0 }
                return (
                  <div key={course.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{course.code}</h3>
                      {getPercentageIcon(courseStat.percentage)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{course.name}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          {courseStat.present}/{courseStat.total} classes
                        </p>
                      </div>
                      {getPercentageBadge(courseStat.percentage)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Detailed Attendance Records</CardTitle>
            <CardDescription>Complete history of your attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((record) => {
                    const course = getCourseById(record.courseId)
                    return (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{course?.code}</TableCell>
                        <TableCell>{course?.name}</TableCell>
                        <TableCell>{getAttendanceBadge(record.status)}</TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
            {attendance.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No attendance records found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
