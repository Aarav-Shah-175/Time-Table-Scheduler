"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { dataService } from "@/lib/data-service"
import { Plus } from "lucide-react"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const TIME_SLOTS = ["09:00-10:30", "11:00-12:30", "14:00-15:30", "16:00-17:30"]

export default function TimetableManagement() {
  const [timetable, setTimetable] = useState([])
  const [courses, setCourses] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    courseId: "",
    day: "",
    startTime: "",
    endTime: "",
    room: "",
  })

  useEffect(() => {
    setTimetable(dataService.getTimetable())
    setCourses(dataService.getCourses())
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const newEntry = {
      id: Math.max(...timetable.map((t) => t.id), 0) + 1,
      ...formData,
      courseId: Number.parseInt(formData.courseId),
      semester: "Fall 2024",
    }

    const updatedTimetable = [...timetable, newEntry]
    setTimetable(updatedTimetable)
    dataService.saveTimetable(updatedTimetable)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      courseId: "",
      day: "",
      startTime: "",
      endTime: "",
      room: "",
    })
    setIsDialogOpen(false)
  }

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
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Timetable Management</h1>
            <p className="text-muted-foreground">Manage class schedules and room assignments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">Add New Class</DialogTitle>
                <DialogDescription>Schedule a new class in the timetable</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                  >
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
                  <Label htmlFor="day">Day</Label>
                  <Select value={formData.day} onValueChange={(value) => setFormData({ ...formData, day: value })}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Add Class
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Weekly Timetable</CardTitle>
            <CardDescription>Current semester class schedule</CardDescription>
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
      </div>
    </DashboardLayout>
  )
}
