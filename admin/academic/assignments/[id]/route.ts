import { type NextRequest, NextResponse } from "next/server"
import { studentClient } from "@/lib/database-clients"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    // Verify admin authentication
    const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (!decoded || !["admin", "faculty"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch assignment
    const assignment = await studentClient.studentAssignment.findUnique({
      where: {
        id: Number(id),
        
      },
      include: {
        student: true,
        // subject: true, // Removed or replace with the correct relation name if available
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Transform data for frontend
    const transformedAssignment = {
      id: assignment.id.toString(),
      studentId: assignment.student_id.toString(),
      studentName: `${assignment.student.first_name} ${assignment.student.last_name}`,
      title: assignment.title,
      subjectId: assignment.subject?.toString() || "",
      dueDate: assignment.due_date.toISOString().split("T")[0],
      status: assignment.status,
      description: assignment.description || "",
      department: assignment.student.department,
      semester: assignment.student.semester,
      section: assignment.student.section,
      createdAt: assignment.created_at.toISOString(),
    }

    return NextResponse.json({
      assignment: transformedAssignment,
    })
  } catch (error) {
    console.error("Error fetching assignment:", error)
    return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

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
    const { title, subjectId, dueDate, description, submissionLink, status } = await request.json()

    // Validate required fields
    if (!title || !dueDate) {
      return NextResponse.json({ error: "Title and due date are required" }, { status: 400 })
    }

    // Get existing assignment to get student ID
    const existingAssignment = await studentClient.studentAssignment.findUnique({
      where: {
        id: Number(id),
      },
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Update assignment
    const updatedAssignment = await studentClient.studentAssignment.update({
      where: {
        id: Number(id),
      },
      data: {
        title,
        id: subjectId ? Number(subjectId) : undefined,
        due_date: new Date(dueDate),
        description: description || "",
        
        status: status || existingAssignment.status,
      },
    })

    // Create notification for the student
    await studentClient.studentNotification.create({
      data: {
        student_id: existingAssignment.student_id,
        title: "Assignment Updated",
        message: `Your assignment "${title}" has been updated. Please check the details.`,
        type: "Assignment",
        isRead: false,
      },
    })

    return NextResponse.json({
      success: true,
      id: updatedAssignment.id.toString(),
    })
  } catch (error) {
    console.error("Error updating assignment:", error)
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    // Verify admin authentication
    const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (!decoded || !["admin", "faculty"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get existing assignment to get student ID
    const existingAssignment = await studentClient.studentAssignment.findUnique({
      where: {
        id: Number(id),
      },
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Delete assignment
    await studentClient.studentAssignment.delete({
      where: {
        id: Number(id),
      },
    })

    // Create notification for the student
    await studentClient.studentNotification.create({
      data: {
        student_id: existingAssignment.student_id,
        title: "Assignment Removed",
        message: `Your assignment "${existingAssignment.title}" has been removed.`,
        type: "Assignment",
        isRead: false,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting assignment:", error)
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 })
  }
}
