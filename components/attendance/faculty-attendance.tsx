"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User, TimeSlot } from "@/types"
import { mockTimetable } from "@/data/mock-data"
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react"

interface FacultyAttendanceProps {
  user: User
}

export function FacultyAttendance({ user }: FacultyAttendanceProps) {
  const [selectedClass, setSelectedClass] = useState<TimeSlot | null>(null)
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: "present" | "absent" | "late" }>({})

  const facultyClasses = mockTimetable.filter((slot) => slot.faculty === user.name)
  const today = new Date().toLocaleDateString("en-CA")

  const mockStudents = [
    { id: "3", name: "John Doe", rollNo: "CS2021001" },
    { id: "4", name: "Jane Smith", rollNo: "CS2021002" },
    { id: "5", name: "Mike Johnson", rollNo: "CS2021003" },
    { id: "6", name: "Sarah Wilson", rollNo: "CS2021004" },
  ]

  const handleAttendanceChange = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const submitAttendance = () => {
    if (!selectedClass) return

    // In a real app, this would save to database
    alert(`Attendance marked for ${selectedClass.subject} on ${today}`)
    setAttendanceData({})
    setSelectedClass(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mark Attendance</h2>
        <p className="text-gray-600">Select a class to mark attendance for today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facultyClasses.map((classItem) => (
          <Card
            key={classItem.id}
            className={`cursor-pointer transition-all ${
              selectedClass?.id === classItem.id ? "ring-2 ring-primary" : "hover:shadow-md"
            }`}
            onClick={() => setSelectedClass(classItem)}
          >
            <CardContent className="p-4">
              <div className="font-semibold text-primary">{classItem.subject}</div>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {classItem.day}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {classItem.startTime} - {classItem.endTime}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {classItem.room}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance - {selectedClass.subject}</CardTitle>
            <CardDescription>
              {selectedClass.day}, {selectedClass.startTime} - {selectedClass.endTime} | Room: {selectedClass.room}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-600">{student.rollNo}</div>
                  </div>
                  <div className="flex gap-2">
                    {(["present", "late", "absent"] as const).map((status) => (
                      <Button
                        key={status}
                        variant={attendanceData[student.id] === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAttendanceChange(student.id, status)}
                        className={
                          status === "present"
                            ? "text-green-600 border-green-600"
                            : status === "late"
                              ? "text-yellow-600 border-yellow-600"
                              : "text-red-600 border-red-600"
                        }
                      >
                        {status === "present" && <CheckCircle className="w-4 h-4 mr-1" />}
                        {status === "absent" && <XCircle className="w-4 h-4 mr-1" />}
                        {status === "late" && <Clock className="w-4 h-4 mr-1" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <Button onClick={submitAttendance} disabled={Object.keys(attendanceData).length === 0}>
                  Submit Attendance
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
