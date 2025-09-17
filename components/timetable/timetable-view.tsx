"use client"

import React from "react"
import type { User } from "@/types"
import { mockTimetable } from "@/data/mock-data"
import { Clock, MapPin, Users } from "lucide-react"

interface TimetableViewProps {
  user: User
  selectedDay: string
  setSelectedDay: (day: string) => void
}

export function TimetableView({ user, selectedDay, setSelectedDay }: TimetableViewProps) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const timeSlots = ["09:00", "10:00", "11:00", "11:30", "12:30", "14:00", "15:00"]

  const getUserTimetable = () => {
    if (user.role === "student") {
      return mockTimetable.filter((slot) => slot.department === user.department && slot.semester === user.semester)
    } else if (user.role === "faculty") {
      return mockTimetable.filter((slot) => slot.faculty === user.name)
    }
    return mockTimetable
  }

  const getSlotForDayAndTime = (day: string, time: string) => {
    return getUserTimetable().find((slot) => slot.day === day && slot.startTime === time)
  }

  const getClassesForDay = (day: string) => {
    return getUserTimetable()
      .filter((slot) => slot.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  if (user.role === "admin") {
    const selectedDayClasses = getClassesForDay(selectedDay)

    const groupedClasses = selectedDayClasses.reduce(
      (acc, classItem) => {
        const key = `${classItem.subject}-${classItem.startTime}-${classItem.endTime}`
        if (!acc[key]) {
          acc[key] = {
            subject: classItem.subject,
            courseCode: classItem.courseCode || "CS101",
            startTime: classItem.startTime,
            endTime: classItem.endTime,
            department: classItem.department,
            semester: classItem.semester,
            sections: [],
          }
        }
        acc[key].sections.push({
          room: classItem.room,
          faculty: classItem.faculty,
        })
        return acc
      },
      {} as Record<
        string,
        {
          subject: string
          courseCode: string
          startTime: string
          endTime: string
          department: string
          semester: number
          sections: Array<{ room: string; faculty: string }>
        }
      >,
    )

    const groupedClassesArray = Object.values(groupedClasses).sort((a, b) => {
      const timeA = new Date(`2024-01-01 ${a.startTime}`).getTime()
      const timeB = new Date(`2024-01-01 ${b.startTime}`).getTime()
      return timeA - timeB
    })

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Weekly Timetable Overview</h2>
          <p className="text-gray-600">System-wide class schedule - Select a day to view detailed schedule</p>
        </div>

        {/* Day Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex border-b border-gray-200">
            {days.map((day) => {
              const dayClassCount = getClassesForDay(day).length
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    selectedDay === day
                      ? "bg-primary text-white border-b-2 border-primary"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div>{day}</div>
                  <div className="text-xs opacity-75">{dayClassCount} classes</div>
                </button>
              )
            })}
          </div>

          {/* Selected Day Content */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{selectedDay} Schedule</h3>
              <span className="text-sm text-gray-500">{selectedDayClasses.length} classes scheduled</span>
            </div>

            {groupedClassesArray.length > 0 ? (
              <div className="space-y-4">
                {groupedClassesArray.map((groupedClass, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="bg-primary text-white px-3 py-1 rounded-md text-sm font-medium">
                            {groupedClass.startTime} - {groupedClass.endTime}
                          </div>
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">
                            {groupedClass.sections.length} Section{groupedClass.sections.length > 1 ? "s" : ""}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-lg font-semibold text-gray-900">
                            {groupedClass.subject} ({groupedClass.courseCode})
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Department:</span> {groupedClass.department} - Semester{" "}
                            {groupedClass.semester}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Class Duration</div>
                        <div className="text-sm font-medium text-gray-700">
                          {(() => {
                            const start = new Date(`2024-01-01 ${groupedClass.startTime}`)
                            const end = new Date(`2024-01-01 ${groupedClass.endTime}`)
                            const duration = (end.getTime() - start.getTime()) / (1000 * 60)
                            return `${duration} mins`
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">Class Sections:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupedClass.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="bg-white rounded-md p-3 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                Room {section.room}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Faculty:</span> {section.faculty}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-lg mb-2">No classes scheduled</div>
                <div className="text-sm">No classes are scheduled for {selectedDay}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {user.role === "student" ? "My Timetable" : user.role === "faculty" ? "My Classes" : "All Timetables"}
        </h2>
        <p className="text-gray-600">
          {user.role === "student" && `${user.department} - Semester ${user.semester}`}
          {user.role === "faculty" && `Your scheduled classes`}
          {user.role === "admin" && `System-wide timetable view`}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-6 gap-0">
          {/* Header */}
          <div className="bg-gray-50 p-4 font-semibold text-gray-900 border-b border-r">Time</div>
          {days.map((day) => (
            <div key={day} className="bg-gray-50 p-4 font-semibold text-gray-900 border-b border-r last:border-r-0">
              {day}
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.map((time) => (
            <React.Fragment key={time}>
              <div className="p-4 font-medium text-gray-700 border-b border-r bg-gray-25">{time}</div>
              {days.map((day) => {
                const slot = getSlotForDayAndTime(day, time)
                return (
                  <div key={`${day}-${time}`} className="p-2 border-b border-r last:border-r-0 min-h-[80px]">
                    {slot && (
                      <div className="bg-primary/10 border border-primary/20 rounded p-2 h-full">
                        <div className="font-semibold text-sm text-primary">{slot.subject}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {slot.room}
                          </div>
                          {user.role !== "faculty" && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="w-3 h-3" />
                              {slot.faculty}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
