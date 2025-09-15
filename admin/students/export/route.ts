import { type NextRequest, NextResponse } from "next/server"
import { studentClient } from "@/lib/database-clients"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { format = "json", filters = {}, includeFields = {} } = body

    // Build where clause based on filters
    const whereClause: any = { is_active: true }

    if (filters.department && filters.department !== "all") {
      whereClause.department = filters.department
    }
    if (filters.semester && filters.semester !== "all") {
      whereClause.semester = Number.parseInt(filters.semester.replace(/\D/g, ""))
    }
    if (filters.section && filters.section !== "all") {
      whereClause.section = filters.section
    }
    if (filters.status && filters.status !== "all") {
      whereClause.is_active = filters.status === "Active"
    }

    const students = await studentClient.student.findMany({
      where: whereClause,
      orderBy: [{ department: "asc" }, { first_name: "asc" }],
      select: {
        student_id: true,
        first_name: true,
        last_name: true,
        email_id: true,
        password_hash: true,
        contact_number: true,
        department: true,
        semester: true,
        section: true,
        updated_at: true,
        admission_year: true,
        attendance: {
          select: {
            status: true,
          },
        },
      },
    })

    const studentsWithAttendance = students.map((student) => {
      const totalClasses = student.attendance.length
      const presentClasses = student.attendance.filter((att) => att.status === "Present").length
      const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

      return {
        id: student.student_id.toString(),
        name: `${student.first_name} ${student.last_name}`,
        email: student.email_id,
        phone: student.contact_number || "N/A",
        department: student.department || "N/A",
        semester: student.semester != null
          ? `${student.semester}${getSemesterSuffix(student.semester)}`
          : "N/A",
        section: student.section || "N/A",
        rollNumber: `${(student.department ?? "NA").substring(0, 2).toUpperCase()}-${student.student_id.toString().substring(0, 6)}`,
        enrollDate: student.admission_year != null
          ? (student.admission_year instanceof Date
            ? student.admission_year.toISOString().split("T")[0]
            : new Date(Number(student.admission_year), 0, 1).toISOString().split("T")[0])
          : "N/A",
        attendance: attendancePercentage,
      }
    })

    const filteredStudents = studentsWithAttendance.filter((student) => {
      if (filters.attendance && filters.attendance !== "all") {
        if (filters.attendance === "above90" && student.attendance < 90) return false
        if (filters.attendance === "above80" && student.attendance < 80) return false
        if (filters.attendance === "above75" && student.attendance < 75) return false
        if (filters.attendance === "below75" && student.attendance >= 75) return false
      }
      return true
    })

    if (format === "csv") {
      const csvData = generateCSV(filteredStudents, includeFields)
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="students_export_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: filteredStudents,
      count: filteredStudents.length,
      exportDate: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error exporting students:", error)
    return NextResponse.json({ success: false, error: "Failed to export student data" }, { status: 500 })
  }
}

function getSemesterSuffix(semester: number): string {
  if (semester === 1) return "st"
  if (semester === 2) return "nd"
  if (semester === 3) return "rd"
  return "th"
}

function generateCSV(students: any[], includeFields: any): string {
  const headers: string[] = []
  const fields: string[] = []

  if (includeFields.personal) {
    headers.push("Name", "Email", "Phone", "Date of Birth", "Address")
    fields.push("name", "email", "phone", "dateOfBirth", "address")
  }

  if (includeFields.academic) {
    headers.push("Roll Number", "Department", "Semester", "Section", "Enroll Date", "Status")
    fields.push("rollNumber", "department", "semester", "section", "enrollDate", "status")
  }

  if (includeFields.attendance) {
    headers.push("Attendance %")
    fields.push("attendance")
  }

  if (includeFields.contact) {
    headers.push("Guardian Name", "Guardian Phone")
    fields.push("guardianName", "guardianPhone")
  }

  const csvRows = [headers.join(",")]

  students.forEach((student) => {
    const row = fields.map((field) => {
      const value = student[field]
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvRows.push(row.join(","))
  })

  return csvRows.join("\n")
}
