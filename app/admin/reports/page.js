"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { dataService } from "@/lib/data-service"
import { Download, FileText, BarChart3 } from "lucide-react"

export default function Reports() {
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [reportData, setReportData] = useState([])
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    overallAttendance: 0,
    lowAttendanceStudents: 0,
  })

  useEffect(() => {
    const coursesData = dataService.getCourses()
    const studentsData = dataService.getUsers().filter((u) => u.role === "student")
    const attendanceData = dataService.getAttendance()

    setCourses(coursesData)
    setStudents(studentsData)
    setAttendance(attendanceData)

    // Calculate overall stats
    const totalAttendance = attendanceData.length
    const presentCount = attendanceData.filter((a) => a.status === "present").length
    const overallAttendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

    // Calculate students with low attendance (< 75%)
    const studentAttendanceRates = studentsData.map((student) => {
      const studentAttendance = attendanceData.filter((a) => a.studentId === student.id)
      const studentTotal = studentAttendance.length
      const studentPresent = studentAttendance.filter((a) => a.status === "present").length
      const rate = studentTotal > 0 ? (studentPresent / studentTotal) * 100 : 0
      return { student, rate }
    })

    const lowAttendanceCount = studentAttendanceRates.filter((s) => s.rate < 75).length

    setOverallStats({
      totalStudents: studentsData.length,
      totalCourses: coursesData.length,
      overallAttendance: overallAttendanceRate,
      lowAttendanceStudents: lowAttendanceCount,
    })
  }, [])

  useEffect(() => {
    if (selectedCourse === "all") {
      generateOverallReport()
    } else {
      generateCourseReport(Number.parseInt(selectedCourse))
    }
  }, [selectedCourse, students, attendance, courses])

  const generateOverallReport = () => {
    const report = students.map((student) => {
      const studentAttendance = attendance.filter((a) => a.studentId === student.id)
      const total = studentAttendance.length
      const present = studentAttendance.filter((a) => a.status === "present").length
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0

      return {
        student,
        total,
        present,
        absent: total - present,
        percentage,
      }
    })

    setReportData(report)
  }

  const generateCourseReport = (courseId) => {
    const courseAttendance = attendance.filter((a) => a.courseId === courseId)
    const report = students.map((student) => {
      const studentCourseAttendance = courseAttendance.filter((a) => a.studentId === student.id)
      const total = studentCourseAttendance.length
      const present = studentCourseAttendance.filter((a) => a.status === "present").length
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0

      return {
        student,
        total,
        present,
        absent: total - present,
        percentage,
      }
    })

    setReportData(report)
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

  const exportToCSV = () => {
    const headers = ["Student Name", "Roll Number", "Total Classes", "Present", "Absent", "Attendance %"]
    const csvContent = [
      headers.join(","),
      ...reportData.map((row) =>
        [row.student.name, row.student.rollNumber || "N/A", row.total, row.present, row.absent, row.percentage].join(
          ",",
        ),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-report-${selectedCourse === "all" ? "overall" : courses.find((c) => c.id === Number.parseInt(selectedCourse))?.code}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate and export attendance reports</p>
          </div>
          <Button onClick={exportToCSV} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Total Students</CardTitle>
              <FileText className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{overallStats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Total Courses</CardTitle>
              <BarChart3 className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{overallStats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Overall Attendance</CardTitle>
              <BarChart3 className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{overallStats.overallAttendance}%</div>
              <p className="text-xs text-muted-foreground">Average attendance rate</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Low Attendance</CardTitle>
              <FileText className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{overallStats.lowAttendanceStudents}</div>
              <p className="text-xs text-muted-foreground">Students below 75%</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Filter Reports</CardTitle>
            <CardDescription>Select a course to view specific attendance reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="All Courses (Overall Report)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses (Overall Report)</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedCourse("all")}
                className="border-border hover:bg-accent"
              >
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              {selectedCourse === "all"
                ? "Overall Attendance Report"
                : `${courses.find((c) => c.id === Number.parseInt(selectedCourse))?.code} Attendance Report`}
            </CardTitle>
            <CardDescription>
              {selectedCourse === "all"
                ? "Complete attendance summary for all students"
                : "Course-specific attendance data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Total Classes</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row) => (
                  <TableRow key={row.student.id}>
                    <TableCell className="font-medium">{row.student.name}</TableCell>
                    <TableCell>{row.student.rollNumber || "N/A"}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell>{row.present}</TableCell>
                    <TableCell>{row.absent}</TableCell>
                    <TableCell>{getPercentageBadge(row.percentage)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {reportData.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No data available for the selected criteria</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
