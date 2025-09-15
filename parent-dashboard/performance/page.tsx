"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParent } from "@/contexts/parent-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, TrendingUp, Award, BookOpen, Target } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface InternalMarksData {
  marks: InternalMark[]
  groupedBySemester: Record<string, InternalMark[]>
  groupedByAcademicYear: Record<string, InternalMark[]>
  subjectPerformance: any[]
  statistics: Statistics
}

export default function PerformanceReports() {
  const { parent, childDetails, isLoading } = useParent()
  const [internalMarksData, setInternalMarksData] = useState<InternalMarksData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<string>("all")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Function to fetch internal marks data for the selected child
  const fetchInternalMarksData = async (childEmail: string) => {
    try {
      console.log("Fetching internal marks for child email:", childEmail)
      setError(null)

      // First try to get student profile by email
      const profileResponse = await fetch(`/api/student/details/${encodeURIComponent(childEmail)}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch student profile: ${profileResponse.status} ${profileResponse.statusText}`)
      }

      const profileData = await profileResponse.json()
      console.log("Student profile data received:", profileData)

      if (!profileData.success || !profileData.student) {
        throw new Error("Student profile not found")
      }

      const student = profileData.student
      const studentId = student.student_id

      // Now try to fetch internal marks using the student ID
      const marksResponse = await fetch(`/api/admin/academic/internal-marks?student_id=${studentId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (marksResponse.ok) {
        const marksResult = await marksResponse.json()
        console.log("Internal marks response:", marksResult)

        if (marksResult.success && marksResult.data && marksResult.data.length > 0) {
          const transformedData = transformInternalMarksData(marksResult.data)
          setInternalMarksData(transformedData)
          setLastUpdated(new Date())
          return
        }
      }

      // If no internal marks found, try to use student marks from profile
      if (student.StudentMarks && student.StudentMarks.length > 0) {
        const transformedData = transformMarksToInternalMarks(student.StudentMarks, student)
        setInternalMarksData(transformedData)
        setLastUpdated(new Date())
      } else {
        // No marks found at all
        setInternalMarksData(null)
        setError("No internal marks available for this student")
      }
    } catch (error) {
      console.error("Error fetching internal marks data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch internal marks data")
      setInternalMarksData(null)
    }
  }

  // Transform marks data to internal marks format
  const transformMarksToInternalMarks = (marks: any[], student: any): InternalMarksData => {
    const internalMarks: InternalMark[] = marks.map((mark, index) => ({
      id: mark.marks_id || index.toString(),
      student_id: mark.student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      roll_number: student.roll_number || "",
      department: student.department || "",
      semester: mark.semester || student.semester || 1,
      section: student.section || "",
      subject: mark.subject || "Unknown Subject",
      academic_year: new Date().getFullYear().toString(),
      internal1_marks: Math.floor((mark.marks || 0) * 0.4),
      internal2_marks: Math.floor((mark.marks || 0) * 0.4),
      assignment_marks: Math.floor((mark.marks || 0) * 0.2),
      total_marks: Math.min(30, mark.marks || 0),
      percentage: Math.round(((mark.marks || 0) / 30) * 100),
      grade: mark.grade || calculateGrade(mark.marks || 0, 30),
      internal1_percentage: Math.round((Math.floor((mark.marks || 0) * 0.4) / 20) * 100),
      internal2_percentage: Math.round((Math.floor((mark.marks || 0) * 0.4) / 20) * 100),
      assignment_percentage: Math.round((Math.floor((mark.marks || 0) * 0.2) / 10) * 100),
      created_at: mark.created_at || new Date().toISOString(),
      updated_at: mark.updated_at || new Date().toISOString(),
    }))

    return processInternalMarksData(internalMarks)
  }

  // Transform internal marks API data
  const transformInternalMarksData = (marks: any[]): InternalMarksData => {
    const internalMarks: InternalMark[] = marks.map((mark) => ({
      id: mark.id.toString(),
      student_id: mark.student_id.toString(),
      student_name: mark.student_name,
      roll_number: mark.roll_number,
      department: mark.department,
      semester: mark.semester,
      section: mark.section,
      subject: mark.subject,
      academic_year: mark.academic_year,
      internal1_marks: mark.internal1_marks,
      internal2_marks: mark.internal2_marks,
      assignment_marks: mark.assignment_marks,
      total_marks: mark.total_marks,
      percentage: mark.percentage,
      grade: mark.grade,
      internal1_percentage: Math.round((mark.internal1_marks / 20) * 100),
      internal2_percentage: Math.round((mark.internal2_marks / 20) * 100),
      assignment_percentage: Math.round((mark.assignment_marks / 10) * 100),
      created_at: mark.created_at,
      updated_at: mark.updated_at,
    }))

    return processInternalMarksData(internalMarks)
  }

  // Process internal marks data to create grouped data and statistics
  const processInternalMarksData = (marks: InternalMark[]): InternalMarksData => {
    // Group by semester
    const groupedBySemester = marks.reduce((acc: Record<string, InternalMark[]>, mark) => {
      const semester = mark.semester.toString()
      if (!acc[semester]) acc[semester] = []
      acc[semester].push(mark)
      return acc
    }, {})

    // Group by academic year
    const groupedByAcademicYear = marks.reduce((acc: Record<string, InternalMark[]>, mark) => {
      const year = mark.academic_year
      if (!acc[year]) acc[year] = []
      acc[year].push(mark)
      return acc
    }, {})

    // Calculate statistics
    const totalSubjects = marks.length
    const totalMarks = marks.reduce((sum, mark) => sum + mark.total_marks, 0)
    const averagePercentage = totalSubjects > 0 ? Math.round((totalMarks / (totalSubjects * 30)) * 100) : 0
    const highestScore = totalSubjects > 0 ? Math.max(...marks.map((mark) => mark.total_marks)) : 0
    const lowestScore = totalSubjects > 0 ? Math.min(...marks.map((mark) => mark.total_marks)) : 0
    const passedSubjects = marks.filter((mark) => mark.percentage >= 40).length
    const failedSubjects = totalSubjects - passedSubjects

    const gradeDistribution = marks.reduce((acc: Record<string, number>, mark) => {
      acc[mark.grade] = (acc[mark.grade] || 0) + 1
      return acc
    }, {})

    const statistics: Statistics = {
      totalSubjects,
      averagePercentage,
      highestScore,
      lowestScore,
      passedSubjects,
      failedSubjects,
      overallGrade: calculateGrade(averagePercentage, 100),
      gradeDistribution,
      passRate: totalSubjects > 0 ? Math.round((passedSubjects / totalSubjects) * 100) : 0,
    }

    return {
      marks,
      groupedBySemester,
      groupedByAcademicYear,
      subjectPerformance: marks,
      statistics,
    }
  }

  // Calculate grade based on percentage
  const calculateGrade = (marks: number, maxMarks: number): string => {
    const percentage = (marks / maxMarks) * 100
    if (percentage >= 90) return "A+"
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B+"
    if (percentage >= 60) return "B"
    if (percentage >= 50) return "C+"
    if (percentage >= 40) return "C"
    return "F"
  }

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !parent) {
      router.push("/parent-dashboard/performance")
      return
    }

    // Load internal marks data for the child
    if (parent && parent.child_email) {
      fetchInternalMarksData(parent.child_email)
    }
  }, [isLoading, parent, router, selectedSemester, selectedAcademicYear])

  const handleRefresh = async () => {
    if (!parent?.child_email) return

    setIsRefreshing(true)
    try {
      await fetchInternalMarksData(parent.child_email)
      toast.success("Performance data refreshed successfully")
    } catch (error) {
      toast.error("Failed to refresh performance data")
    } finally {
      setIsRefreshing(false)
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "B+":
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "C+":
      case "C":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "F":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (isLoading) {
    return <PerformanceSkeleton />
  }

  if (!parent) {
    return null // Will redirect to login
  }

  const childName =
    childDetails?.first_name && childDetails?.last_name
      ? `${childDetails.first_name} ${childDetails.last_name}`
      : parent.child_email || "Your Child"

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Academic Performance</h2>
          <p className="text-muted-foreground">
            Viewing internal marks for <span className="font-medium text-foreground">{childName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</p>
          )}
        </div>
      </div>

      {error && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {internalMarksData && internalMarksData.marks.length > 0 ? (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{internalMarksData.statistics.averagePercentage}%</div>
                <Badge className={getGradeColor(internalMarksData.statistics.overallGrade)}>
                  {internalMarksData.statistics.overallGrade}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{internalMarksData.statistics.totalSubjects}</div>
                <p className="text-xs text-muted-foreground">
                  {internalMarksData.statistics.passedSubjects} passed, {internalMarksData.statistics.failedSubjects}{" "}
                  failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{internalMarksData.statistics.passRate}%</div>
                <Progress value={internalMarksData.statistics.passRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{internalMarksData.statistics.highestScore}/30</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((internalMarksData.statistics.highestScore / 30) * 100)}%
                </p>
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
                    {Object.keys(internalMarksData.groupedByAcademicYear).map((year) => (
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
                    {Object.keys(internalMarksData.groupedBySemester).map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Internal Marks Display */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Marks Details</CardTitle>
              <CardDescription>
                Continuous assessment marks. Formula: (Internal1 + Internal2) ÷ 2 + Assignment = Total (Max: 30)
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
                  {internalMarksData.marks.map((mark) => (
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
                  {Object.entries(internalMarksData.groupedBySemester).map(([semester, semesterMarks]) => (
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
                  {Object.entries(internalMarksData.groupedByAcademicYear).map(([year, yearMarks]) => (
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
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Internal Marks Available</h3>
                <p className="text-muted-foreground">
                  Internal marks for {childName} haven't been uploaded yet. Please check back later or contact the
                  school.
                </p>
              </div>
              <Button onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Try Refreshing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PerformanceSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-48 mb-6" />

      <div className="space-y-6">
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
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
