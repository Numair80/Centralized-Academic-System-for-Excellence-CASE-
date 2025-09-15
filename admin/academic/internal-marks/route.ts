import { type NextRequest, NextResponse } from "next/server"
import { studentClient } from "@/lib/database-clients"

// Helper function to safely stringify objects with BigInt
function safeStringify(obj: any): string {
  return JSON.stringify(obj, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2)
}

// GET - Fetch internal marks (with optional filters)
export async function GET(request: NextRequest) {
  try {
    console.log("=== Admin Internal Marks API Called ===")

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id")
    const semester = searchParams.get("semester")
    const subject = searchParams.get("subject")
    const academicYear = searchParams.get("academic_year")
    const department = searchParams.get("department")

    console.log("Query parameters:", { studentId, semester, subject, academicYear, department })

    // Build where clause
    const whereClause: any = {}

    if (studentId) {
      // Handle both string and BigInt formats
      try {
        const studentIdBigInt = BigInt(studentId)
        whereClause.student_id = studentIdBigInt
        console.log("Using student_id filter:", studentIdBigInt.toString())
      } catch (error) {
        console.log("Invalid student_id format:", studentId)
        return NextResponse.json({ success: false, error: "Invalid student ID format" }, { status: 400 })
      }
    }

    if (semester && semester !== "all") {
      whereClause.student = {
        semester: Number.parseInt(semester),
      }
    }

    if (subject) {
      whereClause.subject = {
        contains: subject,
        mode: "insensitive",
      }
    }

    if (academicYear) {
      whereClause.academic_year = academicYear
    }

    if (department) {
      whereClause.student = {
        ...whereClause.student,
        department: department,
      }
    }

    console.log("Final where clause:", safeStringify(whereClause))

    // Fetch internal marks
    const internalMarks = await studentClient.internalMarks.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            first_name: true,
            last_name: true,
            department: true,
            semester: true,
            section: true,
            email_id: true,
          },
        },
      },
      orderBy: [{ academic_year: "desc" }, { subject: "asc" }, { created_at: "desc" }],
    })

    console.log(`Found ${internalMarks.length} internal marks`)

    // Process marks for JSON serialization
    const processedMarks = internalMarks.map((mark) => ({
      id: mark.id.toString(),
      student_id: mark.student_id.toString(),
      student_name: `${mark.student.first_name} ${mark.student.last_name}`,
      department: mark.student.department,
      semester: mark.student.semester,
      section: mark.student.section,
      email_id: mark.student.email_id,
      subject: mark.subject,
      academic_year: mark.academic_year,
      internal1_marks: mark.internal1_marks,
      internal2_marks: mark.internal2_marks,
      assignment_marks: mark.assignment_marks,
      total_marks: mark.total_marks,
      percentage: Math.round((mark.total_marks / 30) * 100),
      grade: calculateGrade(mark.total_marks, 30),
      created_at: mark.created_at.toISOString(),
      updated_at: mark.updated_at.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: processedMarks,
      count: processedMarks.length,
    })
  } catch (error) {
    console.error("Error fetching internal marks:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch internal marks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Create new internal marks
export async function POST(request: NextRequest) {
  try {
    console.log("=== Creating Internal Marks ===")

    const body = await request.json()
    console.log("Request body:", body)

    const { student_id, subject, academic_year, internal1_marks, internal2_marks, assignment_marks } = body

    // Validate required fields
    if (!student_id || !subject || !academic_year) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: student_id, subject, academic_year" },
        { status: 400 },
      )
    }

    // Validate marks
    const internal1 = Number(internal1_marks) || 0
    const internal2 = Number(internal2_marks) || 0
    const assignment = Number(assignment_marks) || 0

    if (internal1 < 0 || internal1 > 20 || internal2 < 0 || internal2 > 20 || assignment < 0 || assignment > 10) {
      return NextResponse.json(
        { success: false, error: "Invalid marks. Internal marks should be 0-20, assignment marks should be 0-10" },
        { status: 400 },
      )
    }

    // Calculate total marks using the formula: (Internal1 + Internal2) / 2 + Assignment
    const totalMarks = Math.min(30, Math.round((internal1 + internal2) / 2 + assignment))

    console.log("Calculated total marks:", totalMarks)

    // Check if student exists
    const studentExists = await studentClient.student.findFirst({
      where: {
        OR: [{ student_id: BigInt(student_id) }, { student_id: student_id.toString() }],
      },
      select: { student_id: true, first_name: true, last_name: true, department: true, semester: true },
    })

    if (!studentExists) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 })
    }

    console.log("Student found:", studentExists.student_id.toString())

    // Check if internal marks already exist for this student, subject, and academic year
    const existingMarks = await studentClient.internalMarks.findFirst({
      where: {
        student_id: studentExists.student_id,
        subject: subject,
        academic_year: academic_year,
      },
    })

    if (existingMarks) {
      // Update existing marks
      const updatedMarks = await studentClient.internalMarks.update({
        where: { id: existingMarks.id },
        data: {
          internal1_marks: internal1,
          internal2_marks: internal2,
          assignment_marks: assignment,
          total_marks: totalMarks,
          updated_at: new Date(),
        },
        include: {
          student: {
            select: {
              first_name: true,
              last_name: true,
              department: true,
              semester: true,
              section: true,
            },
          },
        },
      })

      console.log("Internal marks updated successfully")

      return NextResponse.json({
        success: true,
        message: "Internal marks updated successfully",
        data: {
          id: updatedMarks.id.toString(),
          student_id: updatedMarks.student_id.toString(),
          student_name: `${updatedMarks.student.first_name} ${updatedMarks.student.last_name}`,
          subject: updatedMarks.subject,
          academic_year: updatedMarks.academic_year,
          internal1_marks: updatedMarks.internal1_marks,
          internal2_marks: updatedMarks.internal2_marks,
          assignment_marks: updatedMarks.assignment_marks,
          total_marks: updatedMarks.total_marks,
          percentage: Math.round((updatedMarks.total_marks / 30) * 100),
          grade: calculateGrade(updatedMarks.total_marks, 30),
        },
      })
    } else {
      // Create new marks
      const newMarks = await studentClient.internalMarks.create({
        data: {
          student_id: studentExists.student_id,
          subject: subject,
          academic_year: academic_year,
          internal1_marks: internal1,
          internal2_marks: internal2,
          assignment_marks: assignment,
          total_marks: totalMarks,
        },
        include: {
          student: {
            select: {
              first_name: true,
              last_name: true,
              department: true,
              semester: true,
              section: true,
            },
          },
        },
      })

      console.log("Internal marks created successfully")

      return NextResponse.json({
        success: true,
        message: "Internal marks created successfully",
        data: {
          id: newMarks.id.toString(),
          student_id: newMarks.student_id.toString(),
          student_name: `${newMarks.student.first_name} ${newMarks.student.last_name}`,
          subject: newMarks.subject,
          academic_year: newMarks.academic_year,
          internal1_marks: newMarks.internal1_marks,
          internal2_marks: newMarks.internal2_marks,
          assignment_marks: newMarks.assignment_marks,
          total_marks: newMarks.total_marks,
          percentage: Math.round((newMarks.total_marks / 30) * 100),
          grade: calculateGrade(newMarks.total_marks, 30),
        },
      })
    }
  } catch (error) {
    console.error("Error creating/updating internal marks:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create/update internal marks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper function to calculate grade
function calculateGrade(marks: number, maxMarks: number): string {
  const percentage = (marks / maxMarks) * 100

  if (percentage >= 90) return "A+"
  if (percentage >= 80) return "A"
  if (percentage >= 70) return "B+"
  if (percentage >= 60) return "B"
  if (percentage >= 50) return "C+"
  if (percentage >= 40) return "C"
  return "F"
}
