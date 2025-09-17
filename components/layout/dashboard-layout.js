"use client"

import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export function DashboardLayout({ children, role }) {
  return (
    <AuthGuard requiredRole={role}>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar role={role} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
