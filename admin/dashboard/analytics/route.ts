import { NextResponse } from "next/server"
import {
  staffClient,
  studentClient,
  parentClient,
  notesClient,
  eventsClient,
  feedbackClient,
} from "@/lib/database-clients"

export async function GET() {
  try {
    // Get analytics data
    const [departmentStats, semesterStats, attendanceStats, monthlyGrowth, topPerformers, systemHealth] =
      await Promise.all([
        getDepartmentStats(),
        getSemesterStats(),
        getAttendanceStats(),
        getMonthlyGrowth(),
        getTopPerformers(),
        getSystemHealth(),
      ])

    const analytics = {
      departmentStats,
      semesterStats,
      attendanceStats,
      monthlyGrowth,
      topPerformers,
      systemHealth,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}

async function getDepartmentStats() {
  try {
    const students = await studentClient.student.groupBy({
      by: ["department"],
      where: { updated_at: { gte: new Date(Date.now())} },
      _count: { student_id: true },
    })

    const staff = await staffClient.staff.groupBy({
      by: ["department"],
      where: { is_active: true },
      _count: { staff_id: true },
    })

    const departments = new Set([...students.map((s) => s.department), ...staff.map((s) => s.department)])

    return Array.from(departments).map((dept) => ({
      department: dept,
      students: students.find((s) => s.department === dept)?._count.student_id || 0,
      staff: staff.find((s) => s.department === dept)?._count.staff_id || 0,
    }))
  } catch (error) {
    console.error("Error fetching department stats:", error)
    return []
  }
}

async function getSemesterStats() {
  try {
    const semesterData = await studentClient.student.groupBy({
      by: ["semester"],
      _count: { student_id: true },
      orderBy: { semester: "asc" },
    })

    return semesterData.map((item) => ({
      semester:
        item.semester != null
          ? `${item.semester}${getSemesterSuffix(item.semester)}`
          : "N/A",
      count: item._count.student_id,
    }))
  } catch (error) {
    console.error("Error fetching semester stats:", error)
    return []
  }
}

async function getAttendanceStats() {
  try {
    const students = await studentClient.student.findMany({
      
      include: {
        attendance: {
          select: { status: true },
        },
      },
    })

    const attendanceRanges = {
      excellent: 0, // 90-100%
      good: 0, // 80-89%
      average: 0, // 70-79%
      poor: 0, // Below 70%
    }

    students.forEach((student) => {
      const totalClasses = student.attendance.length
      if (totalClasses === 0) return

      const presentClasses = student.attendance.filter((att) => att.status === "Present").length
      const percentage = (presentClasses / totalClasses) * 100

      if (percentage >= 90) attendanceRanges.excellent++
      else if (percentage >= 80) attendanceRanges.good++
      else if (percentage >= 70) attendanceRanges.average++
      else attendanceRanges.poor++
    })

    return attendanceRanges
  } catch (error) {
    console.error("Error fetching attendance stats:", error)
    return { excellent: 0, good: 0, average: 0, poor: 0 }
  }
}

async function getMonthlyGrowth() {
  try {
    const currentDate = new Date()
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1)

    const [studentGrowth, staffGrowth, notesGrowth] = await Promise.all([
      getMonthlyData(studentClient.student, "created_at", sixMonthsAgo),
      getMonthlyData(staffClient.staff, "created_at", sixMonthsAgo),
      getMonthlyData(notesClient.note, "upload_date", sixMonthsAgo),
    ])

    return {
      students: studentGrowth,
      staff: staffGrowth,
      notes: notesGrowth,
    }
  } catch (error) {
    console.error("Error fetching monthly growth:", error)
    return { students: [], staff: [], notes: [] }
  }
}

async function getMonthlyData(model: any, dateField: string, fromDate: Date) {
  try {
    const data = await model.findMany({
      where: {
        [dateField]: {
          gte: fromDate,
        },
      },
      select: {
        [dateField]: true,
      },
    })

    const monthlyCount: { [key: string]: number } = {}

    data.forEach((item: any) => {
      const date = new Date(item[dateField])
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1
    })

    return Object.entries(monthlyCount).map(([month, count]) => ({
      month,
      count,
    }))
  } catch (error) {
    console.error("Error fetching monthly data:", error)
    return []
  }
}

async function getTopPerformers() {
  try {
    const students = await studentClient.student.findMany({
      include: {
        attendance: {
          select: { status: true },
        },
        marks: {
          select: { marks: true, max_marks: true },
          orderBy: { created_at: "desc" },
          take: 5,
        },
      },
      take: 100, // Limit to avoid performance issues
    })

    const performanceData = students
      .map((student) => {
        // Calculate attendance
        const totalClasses = student.attendance.length
        const presentClasses = student.attendance.filter((att) => att.status === "Present").length
        const attendance = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0

        // Calculate average marks
        const totalMarks = student.marks.reduce((sum, mark) => sum + Number(mark.max_marks), 0)
        const obtainedMarks = student.marks.reduce((sum, mark) => sum + Number(mark.marks), 0)
        const averageMarks = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0

        // Combined performance score
        const performanceScore = attendance * 0.3 + averageMarks * 0.7

        return {
          id: student.student_id.toString(),
          name: `${student.first_name} ${student.last_name}`,
          department: student.department,
          semester: student.semester,
          attendance,
          averageMarks,
          performanceScore,
        }
      })
      .filter((student) => student.performanceScore > 0)
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10)

    return performanceData
  } catch (error) {
    console.error("Error fetching top performers:", error)
    return []
  }
}

async function getSystemHealth() {
  try {
    const [totalUsers, activeUsers] = await Promise.all([
      getRecentActivityCount(),
      getErrorRate(),
    ])

    return {
      totalUsers,
      activeUsers,
      uptime: "99.9%", // This would come from monitoring service
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Mock data
    }
  } catch (error) {
    console.error("Error fetching system health:", error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      recentActivity: 0,
      errorRate: 0,
      uptime: "Unknown",
      lastBackup: null,
    }
  }
}



async function getRecentActivityCount() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [notes, events, feedback] = await Promise.all([
    notesClient.note.count({
      where: { upload_date: { gte: oneDayAgo } },
    }),
    eventsClient.event.count({
      where: { created_at: { gte: oneDayAgo } },
    }),
    feedbackClient.feedback.count({
      where: { submitted_at: { gte: oneDayAgo } },
    }),
  ])

  return notes + events + feedback
}

async function getErrorRate() {
  // This would come from error monitoring service
  // For now, return a mock low error rate
  return 0.02 // 2% error rate
}

function getSemesterSuffix(semester: number): string {
  if (semester === 1) return "st"
  if (semester === 2) return "nd"
  if (semester === 3) return "rd"
  return "th"
}
