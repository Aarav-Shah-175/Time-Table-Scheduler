// Mock users data
export const mockUsers = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "System Administrator",
    email: "admin@college.edu",
  },
  {
    id: 2,
    username: "faculty1",
    password: "faculty123",
    role: "faculty",
    name: "Dr. John Smith",
    email: "john.smith@college.edu",
    department: "Computer Science",
  },
  {
    id: 3,
    username: "student1",
    password: "student123",
    role: "student",
    name: "Alice Johnson",
    email: "alice.johnson@student.college.edu",
    rollNumber: "CS2021001",
    semester: "Fall 2024",
  },
]

// Mock courses data
export const mockCourses = [
  {
    id: 1,
    code: "CS101",
    name: "Introduction to Programming",
    credits: 3,
    department: "Computer Science",
    facultyId: 2,
  },
  {
    id: 2,
    code: "CS201",
    name: "Data Structures",
    credits: 4,
    department: "Computer Science",
    facultyId: 2,
  },
  {
    id: 3,
    code: "MATH101",
    name: "Calculus I",
    credits: 3,
    department: "Mathematics",
    facultyId: 2,
  },
]

// Mock timetable data
export const mockTimetable = [
  {
    id: 1,
    courseId: 1,
    day: "Monday",
    startTime: "09:00",
    endTime: "10:30",
    room: "Room 101",
    semester: "Fall 2024",
  },
  {
    id: 2,
    courseId: 2,
    day: "Monday",
    startTime: "11:00",
    endTime: "12:30",
    room: "Room 102",
    semester: "Fall 2024",
  },
  {
    id: 3,
    courseId: 3,
    day: "Tuesday",
    startTime: "09:00",
    endTime: "10:30",
    room: "Room 103",
    semester: "Fall 2024",
  },
  {
    id: 4,
    courseId: 1,
    day: "Wednesday",
    startTime: "14:00",
    endTime: "15:30",
    room: "Room 101",
    semester: "Fall 2024",
  },
  {
    id: 5,
    courseId: 2,
    day: "Thursday",
    startTime: "10:00",
    endTime: "11:30",
    room: "Room 102",
    semester: "Fall 2024",
  },
]

// Mock attendance data
export const mockAttendance = [
  {
    id: 1,
    studentId: 3,
    courseId: 1,
    date: "2024-01-15",
    status: "present",
    markedBy: 2,
  },
  {
    id: 2,
    studentId: 3,
    courseId: 2,
    date: "2024-01-15",
    status: "absent",
    markedBy: 2,
  },
  {
    id: 3,
    studentId: 3,
    courseId: 1,
    date: "2024-01-17",
    status: "present",
    markedBy: 2,
  },
]

// Mock semesters data
export const mockSemesters = [
  {
    id: 1,
    name: "Fall 2024",
    startDate: "2024-08-15",
    endDate: "2024-12-15",
    isActive: true,
  },
  {
    id: 2,
    name: "Spring 2025",
    startDate: "2025-01-15",
    endDate: "2025-05-15",
    isActive: false,
  },
]
