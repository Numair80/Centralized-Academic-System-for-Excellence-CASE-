"use client"

import { useState, useEffect } from "react"
import { StudentDashboard } from "@/components/student-interface/student-dashboard"
import { useAuth } from "@/contexts/auth-context"

interface StudentProfile {
  student_id: string
  first_name: string
  last_name: string
  email_id: string
  contact_number: string
  department: string
  semester: number
  section: string
  roll_number: string
  admission_year: number
  date_of_birth?: Date
  address?: string
  guardian_name?: string
  guardian_phone?: string
  blood_group?: string
  cgpa?: number
  StudentAttendance?: any[]
  StudentMarks?: any[]
  StudentAssignment?: any[]
}

export default function StudentInterfacePage() {
  const [studentDetails, setStudentDetails] = useState<StudentProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    const loadStudentProfile = async () => {
      try {
        console.log("Fetching student data from /api/auth/student/me")

        const response = await fetch("/api/auth/student/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("Student API Response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("Student API Response data:", data)

          if (data.success && (data.student || data.user)) {
            const studentData = data.student || data.user
            console.log("Setting student details:", studentData)

            // Update localStorage with fresh data
            localStorage.setItem("user", JSON.stringify(studentData))
            setStudentDetails(studentData)
            setIsLoading(false)
            return
          }
        }

        // Fallback to localStorage if API fails
        console.log("API failed, checking localStorage")
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          console.log("Using stored user data:", userData)

          if (userData.role === "student" || userData.type === "student") {
            setStudentDetails(userData)
          } else {
            setError("Access denied. Student credentials required.")
          }
        } else {
          setError("No student data found. Please login again.")
        }
      } catch (error) {
        console.error("Error loading student profile:", error)
        setError("An error occurred while loading your profile.")
      } finally {
        setIsLoading(false)
      }
    }

    loadStudentProfile()
  }, [user, refreshUser])

  const handleRefresh = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await refreshUser()
      window.location.reload()
    } catch (error) {
      console.error("Failed to refresh data:", error)
      setError("Failed to refresh data. Please try again.")
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              Refresh Session
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!studentDetails) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-4">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">Unable to load student profile. Please try logging in again.</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="bg-card rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-card-foreground">
            Welcome, {studentDetails.first_name} {studentDetails.last_name}
          </h1>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 12a9 9 0 0 0 6.7 15L13 21"></path>
              <path d="M13 21h6v-6"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <StudentDashboard />
    </div>
  )
}
