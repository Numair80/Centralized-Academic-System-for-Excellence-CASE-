import { type NextRequest, NextResponse } from "next/server"
import { studentClient } from "@/lib/database-clients"

// GET - Fetch specific internal marks record
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "Internal marks ID is required" }, { status: 400 })
    }

    const internalMarks = await studentClient.internalMarks.findUnique({
      where: { id: BigInt(id) },
      include: {
        student: {
          select: {
            student_id: true,
            first_name: true,
            last_name: true,
            department: true,
            semester: true,
            section: true,
          },
        },
      },
    })

    if (!internalMarks) {
      return NextResponse.json({ success: false, error: "Internal marks record not found" }, { status: 404 })
    }

    // Process data for JSON serialization
    const processedMarks = {
      id: internalMarks.id.toString(),
      student_id: internalMarks.student_id.toString(),
      student_name: `${internalMarks.student.first_name} ${internalMarks.student.last_name}`,
      
      department: internalMarks.student.department || "",
      semester: internalMarks.student.semester || 1,
      section: internalMarks.student.section || "",
      subject: internalMarks.subject,
      academic_year: internalMarks.academic_year,
      internal1_marks: internalMarks.internal1_marks,
      internal2_marks: internalMarks.internal2_marks,
      assignment_marks: internalMarks.assignment_marks,
      total_marks: internalMarks.total_marks,
      percentage: Math.round((internalMarks.total_marks / 30) * 100),
      grade: calculateGrade(internalMarks.total_marks, 30),
      created_at: internalMarks.created_at.toISOString(),
      updated_at: internalMarks.updated_at.toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: processedMarks,
    })
  } catch (error) {
    console.error("Error fetching internal marks:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch internal marks" }, { status: 500 })
  }
}

// PUT - Update internal marks record
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const data = await request.json()
    const { subject, internal1_marks, internal2_marks, assignment_marks, academic_year } = data

    if (!id) {
      return NextResponse.json({ success: false, error: "Internal marks ID is required" }, { status: 400 })
    }

    // Validate marks ranges
    if (internal1_marks > 20 || internal2_marks > 20 || internal1_marks < 0 || internal2_marks < 0) {
      return NextResponse.json({ success: false, error: "Internal marks must be between 0 and 20" }, { status: 400 })
    }

    if (assignment_marks > 10 || assignment_marks < 0) {
      return NextResponse.json({ success: false, error: "Assignment marks must be between 0 and 10" }, { status: 400 })
    }

    // Check if record exists
    const existingMarks = await studentClient.internalMarks.findUnique({
      where: { id: BigInt(id) },
      include: {
        student: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    })

    if (!existingMarks) {
      return NextResponse.json({ success: false, error: "Internal marks record not found" }, { status: 404 })
    }

    // Calculate new total marks
    const totalMarks = Math.min(30, Math.round((internal1_marks + internal2_marks) / 2 + assignment_marks))

    // Update the record
    const updatedMarks = await studentClient.internalMarks.update({
      where: { id: BigInt(id) },
      data: {
        subject: subject?.trim() || existingMarks.subject,
        academic_year: academic_year?.trim() || existingMarks.academic_year,
        internal1_marks: internal1_marks ?? existingMarks.internal1_marks,
        internal2_marks: internal2_marks ?? existingMarks.internal2_marks,
        assignment_marks: assignment_marks ?? existingMarks.assignment_marks,
        total_marks: totalMarks,
      },
      include: {
        student: {
          select: {
            first_name: true,
            last_name: true,
            department: true,
            semester: true,
            
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Internal marks updated successfully for ${updatedMarks.student.first_name} ${updatedMarks.student.last_name}`,
      data: {
        id: updatedMarks.id.toString(),
        student_id: updatedMarks.student_id.toString(),
        student_name: `${updatedMarks.student.first_name} ${updatedMarks.student.last_name}`,
        
        department: updatedMarks.student.department,
        semester: updatedMarks.student.semester,
        subject: updatedMarks.subject,
        academic_year: updatedMarks.academic_year,
        internal1_marks: updatedMarks.internal1_marks,
        internal2_marks: updatedMarks.internal2_marks,
        assignment_marks: updatedMarks.assignment_marks,
        total_marks: updatedMarks.total_marks,
        percentage: Math.round((updatedMarks.total_marks / 30) * 100),
        grade: calculateGrade(updatedMarks.total_marks, 30),
        updated_at: updatedMarks.updated_at.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error updating internal marks:", error)
    return NextResponse.json({ success: false, error: "Failed to update internal marks" }, { status: 500 })
  }
}

// DELETE - Delete internal marks record
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "Internal marks ID is required" }, { status: 400 })
    }

    // Check if record exists
    const existingMarks = await studentClient.internalMarks.findUnique({
      where: { id: BigInt(id) },
      include: {
        student: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    })

    if (!existingMarks) {
      return NextResponse.json({ success: false, error: "Internal marks record not found" }, { status: 404 })
    }

    // Delete the record
    await studentClient.internalMarks.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({
      success: true,
      message: `Internal marks deleted successfully for ${existingMarks.student.first_name} ${existingMarks.student.last_name} in ${existingMarks.subject}`,
    })
  } catch (error) {
    console.error("Error deleting internal marks:", error)
    return NextResponse.json({ success: false, error: "Failed to delete internal marks" }, { status: 500 })
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
