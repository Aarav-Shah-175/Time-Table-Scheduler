export interface User {
  id: string
  email: string
  password: string
  role: "admin" | "faculty" | "student"
  name: string
  department?: string
  semester?: number
}

export interface TimeSlot {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  faculty: string
  room: string
  department: string
  semester: number
  courseCode?: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  timeSlotId: string
  date: string
  status: "present" | "absent" | "late"
  markedBy: string
}
