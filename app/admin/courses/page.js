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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dataService } from "@/lib/data-service"
import { Plus, Edit, Trash2 } from "lucide-react"

export default function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [faculty, setFaculty] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    credits: "",
    department: "",
    facultyId: "",
  })

  useEffect(() => {
    setCourses(dataService.getCourses())
    const users = dataService.getUsers()
    setFaculty(users.filter((u) => u.role === "faculty"))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const updatedCourses = [...courses]

    if (editingCourse) {
      const index = updatedCourses.findIndex((c) => c.id === editingCourse.id)
      updatedCourses[index] = {
        ...editingCourse,
        ...formData,
        credits: Number.parseInt(formData.credits),
        facultyId: Number.parseInt(formData.facultyId),
      }
    } else {
      const newCourse = {
        id: Math.max(...courses.map((c) => c.id), 0) + 1,
        ...formData,
        credits: Number.parseInt(formData.credits),
        facultyId: Number.parseInt(formData.facultyId),
      }
      updatedCourses.push(newCourse)
    }

    setCourses(updatedCourses)
    dataService.saveCourses(updatedCourses)
    resetForm()
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      code: course.code,
      name: course.name,
      credits: course.credits.toString(),
      department: course.department,
      facultyId: course.facultyId.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (courseId) => {
    const updatedCourses = courses.filter((c) => c.id !== courseId)
    setCourses(updatedCourses)
    dataService.saveCourses(updatedCourses)
  }

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      credits: "",
      department: "",
      facultyId: "",
    })
    setEditingCourse(null)
    setIsDialogOpen(false)
  }

  const getFacultyName = (facultyId) => {
    const facultyMember = faculty.find((f) => f.id === facultyId)
    return facultyMember ? facultyMember.name : "Unassigned"
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
            <p className="text-muted-foreground">Manage courses and faculty assignments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </DialogTitle>
                <DialogDescription>
                  {editingCourse ? "Update course information" : "Create a new course"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Course Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      className="bg-input border-border"
                      placeholder="e.g., CS101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      required
                      className="bg-input border-border"
                      min="1"
                      max="6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-input border-border"
                    placeholder="e.g., Introduction to Programming"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="bg-input border-border"
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faculty">Assigned Faculty</Label>
                  <Select
                    value={formData.facultyId}
                    onValueChange={(value) => setFormData({ ...formData, facultyId: value })}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select faculty member" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculty.map((facultyMember) => (
                        <SelectItem key={facultyMember.id} value={facultyMember.id.toString()}>
                          {facultyMember.name} - {facultyMember.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {editingCourse ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">All Courses</CardTitle>
            <CardDescription>Manage course catalog and faculty assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned Faculty</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.code}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>{course.department}</TableCell>
                    <TableCell>{getFacultyName(course.facultyId)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(course)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(course.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
