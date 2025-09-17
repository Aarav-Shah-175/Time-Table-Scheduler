import { mockUsers } from "./mock-data.js"

// Simple authentication service using localStorage
export const authService = {
  login: (username, password) => {
    const user = mockUsers.find((u) => u.username === username && u.password === password)
    if (user) {
      const { password: _, ...userWithoutPassword } = user
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
      return { success: true, user: userWithoutPassword }
    }
    return { success: false, error: "Invalid credentials" }
  },

  logout: () => {
    localStorage.removeItem("currentUser")
  },

  getCurrentUser: () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser")
      return user ? JSON.parse(user) : null
    }
    return null
  },

  isAuthenticated: () => {
    return authService.getCurrentUser() !== null
  },

  hasRole: (role) => {
    const user = authService.getCurrentUser()
    return user && user.role === role
  },
}
