import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { User } from "@/types"
import { mockTimetable } from "@/data/mock-data"
import { Calendar, Clock, MapPin, Users } from "lucide-react"

interface MyClassesProps {
  user: User
}

export function MyClasses({ user }: MyClassesProps) {
  const facultyClasses = mockTimetable.filter((slot) => slot.faculty === user.name)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Classes</h2>
        <p className="text-gray-600">Manage your assigned classes and schedules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facultyClasses.map((classItem) => (
          <Card key={classItem.id}>
            <CardContent className="p-4">
              <div className="font-semibold text-primary mb-2">{classItem.subject}</div>
              <div className="text-sm text-gray-600 space-y-1">
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
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {classItem.department} - Sem {classItem.semester}
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
                View Students
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
