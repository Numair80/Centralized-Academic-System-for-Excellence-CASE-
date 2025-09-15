import { type NextRequest, NextResponse } from "next/server"
import { assignmentClient, studentClient } from "@/lib/database-clients"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (!decoded || !["admin", "faculty"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")
    const semester = searchParams.get("semester")
    const section = searchParams.get("section")
    const subject = searchParams.get("subject")
    const status = searchParams.get("status")

    // Use the imported assignmentClient directly
    // const assignmentClient = getAssignmentClient()
    //const studentClient = getStudentClient()

    // Build where clause for assignments
    const whereClause: any = {}

    if (subject) {
      whereClause.subject_id = BigInt(subject)
    }

    if (status) {
      whereClause.status = status
    }

    // Fetch assignment records
    const assignments = await assignmentClient.studentAssignment.findMany({
      where: whereClause,
      include: {
        subject: true,
      },
      orderBy: [{ due_date: "asc" }, { student_id: "asc" }],
    })

    // Get student details for each assignment record
    const studentIds = [...new Set(assignments.map((record) => record.student_id))] as bigint[]
    const students = await studentClient.student.findMany({
      where: {
        student_id: {
          in: studentIds,
        },
      },
      select: {
        student_id: true,
        first_name: true,
        last_name: true,
        department: true,
        semester: true,
        section: true,
      },
    })

    // Create a map for quick student lookup
    const studentMap = new Map(students.map((student) => [student.student_id, student]))

    // Filter by student criteria if provided
    let filteredAssignments = assignments
    if (department || semester || section) {
      filteredAssignments = assignments.filter((record) => {
        const student = studentMap.get(record.student_id)
        if (!student) return false

        if (department && student.department !== department) return false
        if (semester && student.semester !== Number.parseInt(semester)) return false
        if (section && student.section !== section) return false

        return true
      })
    }

    // Transform data for frontend
    const transformedAssignments = filteredAssignments.map((assignment) => {
      const student = studentMap.get(assignment.student_id)
      return {
        id: assignment.id.toString(),
        studentId: assignment.student_id.toString(),
        studentName: student ? `${student.first_name} ${student.last_name}` : "Unknown Student",
        title: assignment.title,
        description: assignment.description || "",
        subject: assignment.subject?.name || "Unknown Subject",
        dueDate: assignment.due_date.toISOString().split("T")[0],
        status: assignment.status,
        grade: assignment.grade || "",
        maxMarks: assignment.max_marks || 0,
        obtainedMarks: assignment.obtained_marks || 0,
        submissionLink: assignment.submission_link || "",
        feedback: assignment.feedback || "",
        submittedAt: assignment.submitted_at?.toISOString() || null,
        gradedAt: assignment.graded_at?.toISOString() || null,
        department: student?.department || "N/A",
        semester: student?.semester || 0,
        section: student?.section || "N/A",
      }
    })

    return NextResponse.json({
      success: true,
      assignments: transformedAssignments,
    })
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch assignments",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (!decoded || !["admin", "faculty"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get assignment data from request body
    const { studentId, subjectId, title, description, dueDate, maxMarks, bulkData } = await request.json()

    // Use the imported assignmentClient directly
    // const assignmentClient = getAssignmentClient()

    // Handle bulk assignment creation
    if (bulkData && Array.isArray(bulkData)) {
      const results = []

      for (const item of bulkData) {
        try {
          // Create assignment
          const assignment = await assignmentClient.studentAssignment.create({
            data: {
              student_id: BigInt(item.studentId),
              subject_id: BigInt(item.subjectId),
              title: item.title,
              description: item.description || "",
              due_date: new Date(item.dueDate),
              max_marks: item.maxMarks || 100,
              status: "pending",
              assigned_by: BigInt(decoded.id || decoded.staff_id || 1),
            },
          })

          results.push({
            success: true,
            id: assignment.id.toString(),
            studentId: item.studentId,
          })

          // Create notification for the student
          await assignmentClient.studentNotification.create({
            data: {
              student_id: BigInt(item.studentId),
              title: "New Assignment",
              message: `You have a new assignment: ${item.title}. Due date: ${item.dueDate}.`,
              type: "Assignment",
              is_read: false,
              related_id: assignment.id,
            },
          })
        } catch (error) {
          console.error(`Error creating assignment for student ${item.studentId}:`, error)
          results.push({
            success: false,
            studentId: item.studentId,
            error: "Failed to create assignment",
          })
        }
      }

      return NextResponse.json({
        success: true,
        results,
      })
    }

    // Handle single assignment creation
    if (!studentId || !subjectId || !title || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create assignment
    const assignment = await assignmentClient.studentAssignment.create({
      data: {
        student_id: BigInt(studentId),
        subject_id: BigInt(subjectId),
        title,
        description: description || "",
        due_date: new Date(dueDate),
        max_marks: maxMarks || 100,
        status: "pending",
        assigned_by: BigInt(decoded.id || decoded.staff_id || 1),
      },
    })

    // Get subject name for notification
    const subject = await assignmentClient.subject.findUnique({
      where: {
        id: BigInt(subjectId),
      },
    })

    // Create notification for the student
    await assignmentClient.studentNotification.create({
      data: {
        student_id: BigInt(studentId),
        title: "New Assignment",
        message: `You have a new assignment: ${title} for ${subject?.name || "a subject"}. Due date: ${dueDate}.`,
        type: "Assignment",
        is_read: false,
        related_id: assignment.id,
      },
    })

    return NextResponse.json({
      success: true,
      id: assignment.id.toString(),
    })
  } catch (error) {
    console.error("Error creating assignment:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create assignment",
      },
      { status: 500 },
    )
  }
}
