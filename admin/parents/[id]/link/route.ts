import { type NextRequest, NextResponse } from "next/server"
import { parentClient, studentClient } from "@/lib/database-clients"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parentId = params.id
    const { studentId } = await request.json()

    if (!parentId || !studentId) {
      return NextResponse.json({ success: false, error: "Parent ID and Student ID are required" }, { status: 400 })
    }

    // Get student details
    const student = await studentClient.student.findUnique({
      where: { student_id: BigInt(studentId) },
    })

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 })
    }

    // Check if relationship already exists
    const existingRelation = await parentClient.parentChild.findFirst({
      where: {
        parent_id: Number.parseInt(parentId),
        child_student_id: BigInt(studentId),
      },
    })

    if (existingRelation) {
      return NextResponse.json({ success: false, error: "Student is already linked to this parent" }, { status: 400 })
    }

    // Create parent-child relationship
    await parentClient.parentChild.create({
      data: {
        parent_id: Number.parseInt(parentId),
        child_student_id: BigInt(studentId),
        child_name: `${student.first_name} ${student.last_name}`,
        child_email: student.email_id,
        child_department: student.department,
        child_semester: student.semester,
        child_section: student.section,
        is_primary: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Student ${student.first_name} ${student.last_name} has been linked successfully.`,
    })
  } catch (error) {
    console.error("Error linking child to parent:", error)
    return NextResponse.json({ success: false, error: "Failed to link child to parent" }, { status: 500 })
  }
}
