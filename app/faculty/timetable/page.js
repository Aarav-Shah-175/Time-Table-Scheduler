"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dataService } from "@/lib/data-service"
import { authService } from "@/lib/auth"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const TIME_SLOTS = ["09:00-10:30", "11:00-12:30", "14:00-15:30", "16:00-17:30"]

export default function FacultyTimetable() {
  const [timetable, setTimetable] = useState([])
  const [courses, setCourses] = useState([])

  useEffect(() => {
    const user = authService.getCurrentUser()
    const allCourses = dataService.getCourses()
    const myCourses = allCourses.filter((c) => c.facultyId === user.id)
    setCourses(myCourses)

    const allTimetable = dataService.getTimetable()
    const myTimetable = allTimetable.filter((t) => myCourses.some((c) => c.id === t.courseId))
    setTimetable(myTimetable)
  }, [])

  const getCourseById = (id) => {
    return courses.find((c) => c.id === id)
  }

  const getTimetableGrid = () => {
    const grid = {}
    DAYS.forEach((day) => {
      grid[day] = {}
      TIME_SLOTS.forEach((slot) => {
        grid[day][slot] = null
      })
    })

    timetable.forEach((entry) => {
      const timeSlot = `${entry.startTime}-${entry.endTime}`
      if (grid[entry.day] && grid[entry.day][timeSlot] !== undefined) {
        grid[entry.day][timeSlot] = entry
      }
    })

    return grid
  }

  const grid = getTimetableGrid()

  return (
    <DashboardLayout role="faculty">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Timetable</h1>
          <p className="text-muted-foreground">Your weekly class schedule</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Weekly Schedule</CardTitle>
            <CardDescription>Your assigned classes for the current semester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-border p-2 bg-muted text-left">Time</th>
                    {DAYS.map((day) => (
                      <th key={day} className="border border-border p-2 bg-muted text-center min-w-32">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot) => (
                    <tr key={slot}>
                      <td className="border border-border p-2 bg-muted font-medium">{slot}</td>
                      {DAYS.map((day) => {
                        const entry = grid[day][slot]
                        return (
                          <td key={`${day}-${slot}`} className="border border-border p-2 h-20">
                            {entry && (
                              <div className="bg-primary/10 border border-primary/20 rounded p-2 h-full">
                                <div className="text-sm font-semibold text-primary">
                                  {getCourseById(entry.courseId)?.code}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {getCourseById(entry.courseId)?.name}
                                </div>
                                <div className="text-xs text-muted-foreground">{entry.room}</div>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">My Courses</CardTitle>
            <CardDescription>Courses assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="p-4 border border-border rounded-lg">
                  <h3 className="font-semibold text-foreground">
                    {course.code} - {course.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">Credits: {course.credits}</p>
                  <p className="text-sm text-muted-foreground">Department: {course.department}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
