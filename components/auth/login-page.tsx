"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, BookOpen, Shield } from "lucide-react"

interface LoginPageProps {
  onLogin: (email: string, password: string, role: "admin" | "faculty" | "student") => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<"admin" | "faculty" | "student">("student")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password, selectedRole)
  }

  const getRoleCredentials = (role: "admin" | "faculty" | "student") => {
    const credentials = {
      admin: { email: "admin@college.edu", password: "admin123" },
      faculty: { email: "faculty@college.edu", password: "faculty123" },
      student: { email: "student@college.edu", password: "student123" },
    }
    return credentials[role]
  }

  const fillDemoCredentials = (role: "admin" | "faculty" | "student") => {
    const creds = getRoleCredentials(role)
    setEmail(creds.email)
    setPassword(creds.password)
    setSelectedRole(role)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">College Portal</CardTitle>
          <CardDescription>Timetable & Attendance Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {(["student", "faculty", "admin"] as const).map((role) => (
              <Card
                key={role}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedRole === role ? "ring-2 ring-primary bg-primary/10" : ""
                }`}
                onClick={() => fillDemoCredentials(role)}
              >
                <CardContent className="p-4 text-center">
                  <div className="mb-2">
                    {role === "student" && <GraduationCap className="w-8 h-8 mx-auto text-blue-600" />}
                    {role === "faculty" && <BookOpen className="w-8 h-8 mx-auto text-green-600" />}
                    {role === "admin" && <Shield className="w-8 h-8 mx-auto text-purple-600" />}
                  </div>
                  <h3
                    className={`font-semibold capitalize ${
                      selectedRole === role ? "text-black" : "text-card-foreground"
                    }`}
                  >
                    {role}
                  </h3>
                  <p className={`text-xs mt-1 ${selectedRole === role ? "text-black" : "text-muted-foreground"}`}>
                    {role === "student" && "View timetable & attendance"}
                    {role === "faculty" && "Mark attendance & manage classes"}
                    {role === "admin" && "Manage users & system settings"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-center text-gray-600">
              Click on any role card above to auto-fill demo credentials
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
