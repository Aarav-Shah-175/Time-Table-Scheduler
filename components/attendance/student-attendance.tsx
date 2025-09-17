import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/types"
import { mockTimetable } from "@/data/mock-data"
import { Calendar, CheckCircle, BarChart3, BookOpen } from "lucide-react"

interface StudentAttendanceProps {
  user: User
}

export function StudentAttendance({ user }: StudentAttendanceProps) {
  const studentClasses = mockTimetable.filter(
    (slot) => slot.department === user.department && slot.semester === user.semester,
  )

  const getAttendanceStats = () => {
    const totalClasses = 20 // Mock total classes
    const attendedClasses = 18 // Mock attended classes
    const percentage = Math.round((attendedClasses / totalClasses) * 100)

    return { totalClasses, attendedClasses, percentage }
  }

  const stats = getAttendanceStats()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Attendance</h2>
        <p className="text-gray-600">Track your attendance across all subjects</p>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Classes Attended</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendedClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.percentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Attendance</CardTitle>
          <CardDescription>Your attendance record for each subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(new Set(studentClasses.map((c) => c.subject))).map((subject) => {
              const subjectClasses = studentClasses.filter((c) => c.subject === subject)
              const mockAttended = Math.floor(Math.random() * 5) + 15 // Mock data
              const mockTotal = 20
              const percentage = Math.round((mockAttended / mockTotal) * 100)

              return (
                <div key={subject} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-primary mr-3" />
                    <div>
                      <div className="font-medium">{subject}</div>
                      <div className="text-sm text-gray-600">
                        {subjectClasses[0]?.faculty} • {subjectClasses[0]?.room}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {mockAttended}/{mockTotal}
                    </div>
                    <div
                      className={`text-sm ${
                        percentage >= 75 ? "text-green-600" : percentage >= 60 ? "text-yellow-600" : "text-red-600"
                      }`}
                    >
                      {percentage}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
