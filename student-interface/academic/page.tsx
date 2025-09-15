"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, TrendingUp, Award, BookOpen, Target, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

interface InternalMark {
  id: string
  student_id: string
  student_name: string
  roll_number: string
  department: string
  semester: number
  section: string
  subject: string
  academic_year: string
  internal1_marks: number
  internal2_marks: number
  assignment_marks: number
  total_marks: number
  percentage: number
  grade: string
  internal1_percentage: number
  internal2_percentage: number
  assignment_percentage: number
  created_at: string
  updated_at: string
}

interface Statistics {
  totalSubjects: number
  averagePercentage: number
  highestScore: number
  lowestScore: number
  passedSubjects: number
  failedSubjects: number
  overallGrade: string
  gradeDistribution: Record<string, number>
  passRate: number
}

interface StudentInfo {
  id: string
  name: string
  roll_number: string
  department: string
  semester: number
  section: string
}

interface InternalMarksData {
  student: StudentInfo
  marks: InternalMark[]
  groupedBySemester: Record<string, InternalMark[]>
  groupedByAcademicYear: Record<string, InternalMark[]>
  subjectPerformance: any[]
  statistics: Statistics
}

export default function AcademicPage() {
  const { user } = useAuth()
  const [internalMarksData, setInternalMarksData] = useState<InternalMarksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState<string>("all")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  const fetchInternalMarks = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching internal marks...")
      console.log("Current user:", user)

      if (!user) {
        setError("Please log in to view your internal marks.")
        toast.error("Please log in to view your internal marks.")
        return
      }

      if (user.role !== "student") {
        setError("Access denied. This page is only available to students.")
        toast.error("Access denied. This page is only available to students.")
        return
      }

      const params = new URLSearchParams()
      if (selectedSemester !== "all") params.append("semester", selectedSemester)
      if (selectedAcademicYear !== "all") params.append("academic_year", selectedAcademicYear)

      console.log("Making API request with params:", params.toString())

      // Get the auth token from localStorage or cookies
      const authToken =
        localStorage.getItem("auth-token") ||
        document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("auth-token="))
          ?.split("=")[1]

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`
      }

      const response = await fetch(`/api/student/internal-marks?${params.toString()}`, {
        method: "GET",
        headers,
        credentials: "include",
      })

      console.log("API response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("API response:", result)

        if (result.success) {
          setInternalMarksData(result.data)
          console.log("Internal marks loaded:", result.data.marks.length, "marks found")

          if (result.data.marks.length === 0) {
            toast.info("No internal marks found. Please check with your faculty.")
          } else {
            toast.success(`Loaded ${result.data.marks.length} internal marks`)
          }
        } else {
          setError(result.error || "Failed to fetch internal marks")
          toast.error(result.error || "Failed to fetch internal marks")
          console.error("API error:", result.error, result.debug)
        }
      } else if (response.status === 401) {
        setError("Authentication failed. Please login again.")
        toast.error("Authentication failed. Please login again.")
      } else if (response.status === 403) {
        setError("Access denied. This page is only available to students.")
        toast.error("Access denied. This page is only available to students.")
      } else if (response.status === 404) {
        setError("Student record not found. Please contact administration.")
        toast.error("Student record not found. Please contact administration.")
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Failed to fetch internal marks")
        toast.error(errorData.error || "Failed to fetch internal marks")
        console.error("API error:", errorData)
      }
    } catch (error) {
      console.error("Error fetching internal marks:", error)
      setError("Network error. Please check your connection and try again.")
      toast.error("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchInternalMarks()
    setRefreshing(false)
  }

  useEffect(() => {
    if (user) {
      fetchInternalMarks()
    }
  }, [user, selectedSemester, selectedAcademicYear])

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "A":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400"
      case "B+":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "B":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400"
      case "C+":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "C":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400"
      case "F":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Authentication Required</h3>
                <p className="text-muted-foreground">Please log in to view your internal marks.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Performance</h1>
            <p className="text-muted-foreground">View your internal marks and academic progress</p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-600">Error Loading Internal Marks</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!internalMarksData || internalMarksData.marks.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Performance</h1>
            <p className="text-muted-foreground">View your internal marks and academic progress</p>
            {internalMarksData?.student && (
              <p className="text-sm text-muted-foreground mt-1">
                {internalMarksData.student.name} • {internalMarksData.student.roll_number} •{" "}
                {internalMarksData.student.department}
              </p>
            )}
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Internal Marks Found</h3>
                <p className="text-muted-foreground">
                  Your internal marks haven't been uploaded yet. Please check back later or contact your faculty.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  If you believe this is an error, please contact the academic office.
                </p>
              </div>
              <Button onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Check Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { marks, groupedBySemester, groupedByAcademicYear, statistics, student } = internalMarksData

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Performance</h1>
          <p className="text-muted-foreground">View your internal marks and academic progress</p>
          <p className="text-sm text-muted-foreground mt-1">
            {student.name} • {student.roll_number} • {student.department} • Semester {student.semester}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.averagePercentage}%</div>
            <Badge className={getGradeColor(statistics.overallGrade)}>{statistics.overallGrade}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.passedSubjects} passed, {statistics.failedSubjects} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.passRate}%</div>
            <Progress value={statistics.passRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.highestScore}/30</div>
            <p className="text-xs text-muted-foreground">{Math.round((statistics.highestScore / 30) * 100)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium">Academic Year</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Years</option>
                {Object.keys(groupedByAcademicYear).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Semesters</option>
                {Object.keys(groupedBySemester).map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internal Marks */}
      <Card>
        <CardHeader>
          <CardTitle>Internal Marks</CardTitle>
          <CardDescription>
            Your continuous assessment marks. Formula: (Internal1 + Internal2) ÷ 2 + Assignment = Total (Max: 30)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="semester">By Semester</TabsTrigger>
              <TabsTrigger value="year">By Academic Year</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {marks.map((mark) => (
                <Card key={mark.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{mark.subject}</h3>
                          <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Semester {mark.semester} • {mark.academic_year} • Section {mark.section}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Internal 1</p>
                            <p className="font-medium">
                              {mark.internal1_marks}/20 ({mark.internal1_percentage}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Internal 2</p>
                            <p className="font-medium">
                              {mark.internal2_marks}/20 ({mark.internal2_percentage}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Assignment</p>
                            <p className="font-medium">
                              {mark.assignment_marks}/10 ({mark.assignment_percentage}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-bold text-lg">
                              {mark.total_marks}/30 ({mark.percentage}%)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="semester" className="space-y-4">
              {Object.entries(groupedBySemester).map(([semester, semesterMarks]) => (
                <Card key={semester}>
                  <CardHeader>
                    <CardTitle>Semester {semester}</CardTitle>
                    <CardDescription>{semesterMarks.length} subjects</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {semesterMarks.map((mark) => (
                      <div key={mark.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{mark.subject}</h4>
                          <p className="text-sm text-muted-foreground">{mark.academic_year}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{mark.total_marks}/30</span>
                            <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{mark.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="year" className="space-y-4">
              {Object.entries(groupedByAcademicYear).map(([year, yearMarks]) => (
                <Card key={year}>
                  <CardHeader>
                    <CardTitle>Academic Year {year}</CardTitle>
                    <CardDescription>{yearMarks.length} subjects</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {yearMarks.map((mark) => (
                      <div key={mark.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{mark.subject}</h4>
                          <p className="text-sm text-muted-foreground">Semester {mark.semester}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{mark.total_marks}/30</span>
                            <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{mark.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
