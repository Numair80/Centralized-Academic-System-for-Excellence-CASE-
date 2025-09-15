"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CalendarDays,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  User,
  BookOpen,
  Clock,
  AlertCircle,
  RefreshCw,
  UserCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sidebar } from "@/components/parent-interface/sidebar"
import { Header } from "@/components/parent-interface/header"
import Link from "next/link"

interface StudentDetails {
  student_id: string
  first_name: string
  last_name: string
  email_id: string
  contact_number: string
  department: string
  semester: number
  section: string
  year: number
  cgpa?: number
  profile_picture?: string
  StudentAttendance?: any[]
  StudentMarks?: any[]
  StudentAssignment?: any[]
  attendancePercentage?: number
  averagePercentage?: number
  totalClasses?: number
  presentClasses?: number
}

interface ParentData {
  id: string
  parent_id?: string
  username?: string
  first_name: string
  last_name: string
  name: string
  email: string
  contact_number: string
  address?: string
  occupation?: string
  relationship: string
  child_email?: string
  childDetails?: StudentDetails
  role: string
  type: string
}

export default function ParentDashboard() {
  const [parent, setParent] = useState<ParentData | null>(null)
  const [childDetails, setChildDetails] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadParentData = async () => {
      try {
        console.log("Starting parent data load from /api/auth/parent/me...")
        setIsLoading(true)
        setError(null)

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log("API call timeout, falling back to localStorage")
          handleFallbackToLocalStorage()
        }, 10000) // 10 second timeout

        try {
          console.log("Fetching authenticated parent data from /api/auth/parent/me")
          const response = await fetch("/api/auth/parent/me", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          })

          clearTimeout(timeoutId) // Clear timeout if API responds

          console.log("Parent API Response status:", response.status)

          if (response.ok) {
            const data = await response.json()
            console.log("Parent auth data from server:", data)

            if (data.success && data.user) {
              const userData = data.user

              console.log("Parent data loaded successfully:", userData.name)

              // Update localStorage with fresh data
              localStorage.setItem("user", JSON.stringify(userData))
              setParent(userData)

              // Set child details if available
              if (userData.childDetails) {
                console.log("Child details found:", userData.childDetails.first_name)
                setChildDetails(userData.childDetails)
              } else {
                console.log("No child details found in user data")
              }

              setIsLoading(false)
              return
            } else {
              console.log("API response missing success or user data:", data)
            }
          } else {
            const errorData = await response.json()
            console.log("API response not ok:", response.status, errorData)

            if (response.status === 401) {
              // Unauthorized - redirect to login
              console.log("Unauthorized - redirecting to login")
              router.push("/login")
              return
            }
          }
        } catch (apiError) {
          clearTimeout(timeoutId)
          console.error("API call failed:", apiError)
        }

        // Fallback to localStorage if API fails
        handleFallbackToLocalStorage()
      } catch (error) {
        console.error("Error in loadParentData:", error)
        setError("Failed to load parent data. Please try refreshing the page.")
        setIsLoading(false)
      }
    }

    const handleFallbackToLocalStorage = () => {
      console.log("Attempting fallback to localStorage...")
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          console.log("Using stored user data:", userData)

          if (userData.role === "parent" || userData.type === "parent") {
            setParent(userData)
            if (userData.childDetails) {
              setChildDetails(userData.childDetails)
            }
            console.log("Successfully loaded from localStorage")
          } else {
            console.log("Stored user is not a parent")
            setError("Access denied. Parent credentials required.")
          }
        } else {
          console.log("No stored user data found")
          setError("No user data found. Please login again.")
        }
      } catch (storageError) {
        console.error("Error reading from localStorage:", storageError)
        setError("Failed to load user data. Please login again.")
      }
      setIsLoading(false)
    }

    loadParentData()
  }, [router])

  const refreshChildDetails = async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      console.log("Refreshing child details from /api/auth/parent/me...")
      const response = await fetch("/api/auth/parent/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          const userData = data.user
          setParent(userData)

          if (userData.childDetails) {
            setChildDetails(userData.childDetails)
            localStorage.setItem("user", JSON.stringify(userData))
            toast.success("Child details refreshed successfully")
          } else {
            setError("No child details found")
            toast.error("No child details found")
          }
        } else {
          setError("Failed to refresh data")
          toast.error("Failed to refresh data")
        }
      } else {
        setError("Failed to refresh child details")
        toast.error("Failed to refresh child details")
      }
    } catch (error) {
      console.error("Error refreshing child details:", error)
      setError("Failed to refresh child details")
      toast.error("Failed to refresh child details")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parent dashboard...</p>
          <Button variant="outline" onClick={handleRetry} className="mt-4">
            Cancel & Retry
          </Button>
        </div>
      </div>
    )
  }

  if (error && !parent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="flex gap-2">
              <Button onClick={handleRetry} className="flex-1">
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push("/login")} className="flex-1">
                Login Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!parent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Please log in as a parent to access this dashboard.</p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!childDetails) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar
          open={true}
          onToggle={() => {}}
          onClose={() => {}}
          isMobile={false}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onToggleSidebar={() => {}} />
          <main className="flex-1 overflow-y-auto p-6">
            {/* Parent Info Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-8 w-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {parent.name}</h1>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {parent.relationship} • Parent Portal
                    </p>
                  </div>
                </div>
                <div className="ml-auto">
                  <Link href="/parent-dashboard/account">
                    <Badge variant="outline" className="text-sm cursor-pointer hover:bg-blue-50">
                      Parent Account
                    </Badge>
                  </Link>
                </div>
              </div>
            </div>

            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>No Child Information Available</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">No child information is currently linked to this parent account.</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Parent: {parent.name}</p>
                  <p>Email: {parent.email}</p>
                  <p>Child Email: {parent.child_email || "Not linked"}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={refreshChildDetails} disabled={isRefreshing} className="flex-1">
                    {isRefreshing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/login")} className="flex-1">
                    Login Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  // Get pending assignments
  const pendingAssignments = childDetails.StudentAssignment?.filter((a) => a.status === "Pending") || []

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        open={true}
        onToggle={() => {}}
        onClose={() => {}}
        isMobile={false}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => {}} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Parent Info Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-8 w-8 text-blue-600" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {parent.name}</h1>
                      <p className="text-blue-600 dark:text-blue-400 font-medium">
                        {parent.relationship} • Parent Portal
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={refreshChildDetails} disabled={isRefreshing}>
                    {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                  <Link href="/parent-dashboard/account">
                    <Badge variant="outline" className="text-sm cursor-pointer hover:bg-blue-50">
                      Parent Account
                    </Badge>
                  </Link>
                </div>
              </div>
            </div>

            {/* Child Dashboard Header */}
            <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-r-lg">
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {childDetails.first_name} {childDetails.last_name}'s Academic Dashboard
              </h2>
              <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                Real-time academic performance and attendance tracking
              </p>
            </div>

            {/* Student Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={childDetails.profile_picture || "/placeholder.svg"} />
                    <AvatarFallback>
                      {childDetails.first_name?.[0]}
                      {childDetails.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {childDetails.first_name} {childDetails.last_name}
                    </h2>
                    <p className="text-gray-600">Roll No: {childDetails.student_id}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      {childDetails.department} - Semester {childDetails.semester}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{childDetails.email_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">{childDetails.contact_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm">Year: {childDetails.year}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Attendance Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Attendance
                  </CardTitle>
                  <CardDescription>Overall attendance percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Present: {childDetails.presentClasses || 0}</span>
                      <span>Total: {childDetails.totalClasses || 0}</span>
                    </div>
                    <Progress value={childDetails.attendancePercentage || 0} className="h-2" />
                    <p className="text-2xl font-bold text-center">{childDetails.attendancePercentage || 0}%</p>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Academic Performance
                  </CardTitle>
                  <CardDescription>Marks and CGPA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">CGPA</p>
                      <p className="text-2xl font-bold text-green-600">{childDetails.cgpa || "N/A"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Average Marks</p>
                      <p className="text-xl font-semibold">{childDetails.averagePercentage || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Assignments
                  </CardTitle>
                  <CardDescription>Assignment status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-center text-orange-600">{pendingAssignments.length}</p>
                    <p className="text-sm text-center text-gray-600">Pending Assignments</p>
                    <p className="text-sm text-center text-gray-600">
                      Total: {childDetails.StudentAssignment?.length || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Attendance */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                  <CardDescription>Latest attendance records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {childDetails.StudentAttendance?.slice(0, 5).map((record, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{record.subject || "Subject"}</p>
                          <p className="text-xs text-gray-600">
                            {record.date ? new Date(record.date).toLocaleDateString() : "Date"} - Period{" "}
                            {record.period || "N/A"}
                          </p>
                        </div>
                        <Badge variant={record.status === "Present" ? "default" : "destructive"} className="text-xs">
                          {record.status || "Unknown"}
                        </Badge>
                      </div>
                    )) || <p className="text-center text-gray-500 py-4">No attendance records found</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Marks */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Marks</CardTitle>
                  <CardDescription>Latest exam results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {childDetails.StudentMarks?.slice(0, 5).map((mark, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{mark.subject || "Subject"}</p>
                          <p className="text-xs text-gray-600">
                            {mark.exam_type || "Exam"} - Semester {mark.semester || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">
                            {mark.marks || 0}/{mark.max_marks || 100}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {mark.grade || "N/A"}
                          </Badge>
                        </div>
                      </div>
                    )) || <p className="text-center text-gray-500 py-4">No marks records found</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
