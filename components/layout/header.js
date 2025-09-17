"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authService } from "@/lib/auth"
import { LogOut, User } from "lucide-react"

export function Header() {
  const router = useRouter()
  const user = authService.getCurrentUser()

  const handleLogout = () => {
    authService.logout()
    router.push("/")
  }

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">College Timetable System</h1>
          {user && (
            <p className="text-sm text-muted-foreground">
              Welcome, {user.name} ({user.role})
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-border hover:bg-accent bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
