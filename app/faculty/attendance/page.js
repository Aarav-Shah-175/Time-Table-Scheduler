"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dataService } from "@/lib/data-service"
import { authService } from "@/lib/auth"
import { CheckCircle, XCircle, Save } from "lucide-react"

export default function AttendanceMarking() {
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [attendance, setAttendance] = useState({})
  const [existingAttendance, setExistingAttendance] = useState([])

  useEffect(() => {
    const user = authService.getCurrentUser()
    const allCourses = dataService.getCourses()
    const myCourses = allCourses.filter((c) => c.facultyId === user.id)
    setCourses(myCourses)

    const allStudents = dataService.getUsers().filter((u) => u.role === "student")
    setStudents(allStudents)

    setExistingAttendance(dataService.getAttendance())
  }, [])

  useEffect(() => {
    // Initialize attendance state when course or date changes
    if (selectedCourse && students.length > 0) {
      const initialAttendance = {}
      students.forEach((student) => {
        // Check if attendance already exists for this student, course, and date
        const existing = existingAttendance.find(
          (a) =>
            a.studentId === student.id && a.courseId === Number.parseInt(selectedCourse) && a.date === selectedDate,
        )
        initialAttendance[student.id] = existing ? existing.status : "present"
      })
      setAttendance(initialAttendance)
    }
  }, [selectedCourse, selectedDate, students, existingAttendance])

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const handleSaveAttendance = () => {
    if (!selectedCourse) return

    const user = authService.getCurrentUser()
    const updatedAttendance = [...existingAttendance]

    // Remove existing attendance for this course and date
    const filteredAttendance = updatedAttendance.filter(
      (a) => !(a.courseId === Number.parseInt(selectedCourse) && a.date === selectedDate),
    )

    // Add new attendance records
    Object.entries(attendance).forEach(([studentId, status]) => {
      filteredAttendance.push({
        id: Math.max(...existingAttendance.map((a) => a.id), 0) + filteredAttendance.length + 1,
        studentId: Number.parseInt(studentId),
        courseId: Number.parseInt(selectedCourse),
        date: selectedDate,
        status,
        markedBy: user.id,
      })
    })

    dataService.saveAttendance(filteredAttendance)
    setExistingAttendance(filteredAttendance)
    alert("Attendance saved successfully!")
  }

  const getSelectedCourse = () => {
    return courses.find((c) => c.id === Number.parseInt(selectedCourse))
  }

  const getAttendanceStats = () => {
    const total = Object.keys(attendance).length
    const present = Object.values(attendance).filter((status) => status === "present").length
    const absent = total - present
    return { total, present, absent }
  }

  const stats = getAttendanceStats()

  return (
    <DashboardLayout role="faculty">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mark Attendance</h1>
          <p className="text-muted-foreground">Record student attendance for your courses</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Select Course and Date</CardTitle>
            <CardDescription>Choose the course and date to mark attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input"
                />
              </div>
            </div>

            {selectedCourse && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="text-sm">
                  <strong>Course:</strong> {getSelectedCourse()?.code} - {getSelectedCourse()?.name}
                </div>
                <div className="text-sm">
                  <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}
                </div>
                <div className="flex gap-2 ml-auto">
                  <Badge className="bg-chart-1 text-white">Present: {stats.present}</Badge>
                  <Badge className="bg-destructive text-destructive-foreground">Absent: {stats.absent}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCourse && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-card-foreground">Student Attendance</CardTitle>
                <CardDescription>Mark attendance for each student</CardDescription>
              </div>
              <Button onClick={handleSaveAttendance} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="h-4 w-4 mr-2" />
                Save Attendance
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.rollNumber}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={attendance[student.id] === "present" ? "default" : "outline"}
                            onClick={() => handleAttendanceChange(student.id, "present")}
                            className={
                              attendance[student.id] === "present" ? "bg-chart-1 hover:bg-chart-1/90 text-white" : ""
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={attendance[student.id] === "absent" ? "default" : "outline"}
                            onClick={() => handleAttendanceChange(student.id, "absent")}
                            className={
                              attendance[student.id] === "absent"
                                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                : ""
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
