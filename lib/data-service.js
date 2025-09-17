import { mockUsers, mockCourses, mockTimetable, mockAttendance, mockSemesters } from "./mock-data.js"

// Simple data service using localStorage for persistence
export const dataService = {
  // Users
  getUsers: () => {
    const stored = localStorage.getItem("users")
    return stored ? JSON.parse(stored) : mockUsers
  },

  saveUsers: (users) => {
    localStorage.setItem("users", JSON.stringify(users))
  },

  // Courses
  getCourses: () => {
    const stored = localStorage.getItem("courses")
    return stored ? JSON.parse(stored) : mockCourses
  },

  saveCourses: (courses) => {
    localStorage.setItem("courses", JSON.stringify(courses))
  },

  // Timetable
  getTimetable: () => {
    const stored = localStorage.getItem("timetable")
    return stored ? JSON.parse(stored) : mockTimetable
  },

  saveTimetable: (timetable) => {
    localStorage.setItem("timetable", JSON.stringify(timetable))
  },

  // Attendance
  getAttendance: () => {
    const stored = localStorage.getItem("attendance")
    return stored ? JSON.parse(stored) : mockAttendance
  },

  saveAttendance: (attendance) => {
    localStorage.setItem("attendance", JSON.stringify(attendance))
  },

  // Semesters
  getSemesters: () => {
    const stored = localStorage.getItem("semesters")
    return stored ? JSON.parse(stored) : mockSemesters
  },

  saveSemesters: (semesters) => {
    localStorage.setItem("semesters", JSON.stringify(semesters))
  },

  // Helper methods
  getActiveSemester: () => {
    const semesters = dataService.getSemesters()
    return semesters.find((s) => s.isActive) || semesters[0]
  },

  getCourseById: (id) => {
    const courses = dataService.getCourses()
    return courses.find((c) => c.id === id)
  },

  getUserById: (id) => {
    const users = dataService.getUsers()
    return users.find((u) => u.id === id)
  },
}
