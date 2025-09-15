// app/api/admin/students/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { studentClient } from "@/lib/database-clients"
import bcrypt from "bcryptjs"

// ===== GET: Fetch student with details =====
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "Student ID is required" }, { status: 400 })
    }

    const student = await studentClient.student.findUnique({
      where: { student_id: BigInt(id) },
      include: {
        attendance: { take: 10, orderBy: { date: "desc" } },
        marks: { take: 10, orderBy: { created_at: "desc" } },
        assignment: { take: 5, orderBy: { created_at: "desc" } },
        studentNotification: { take: 5, orderBy: { created_at: "desc" } },
      },
    })

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 })
    }

    const totalClasses = student.attendance.length
    const presentClasses = student.attendance.filter((att: { status: string }) => att.status === "Present").length
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

    const responseData = {
      ...student,
      student_id: student.student_id.toString(),
      id: student.student_id.toString(),
      name: `${student.first_name} ${student.last_name}`,
      email: student.email_id,
      phone: student.contact_number,
      attendance: attendancePercentage,
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch student" }, { status: 500 })
  }
}

// ===== PUT: Update student info =====
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "Student ID is required" }, { status: 400 })
    }

    const { password, ...updateData } = data

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12)
    }

    if (updateData.semester) {
      updateData.semester = Number.parseInt(updateData.semester?.replace(/\D/g, "") || "1")
    }

    if (updateData.admission_year) {
      updateData.admission_year = Number.parseInt(updateData.admission_year)
    }

    if (updateData.date_of_birth) {
      updateData.date_of_birth = new Date(updateData.date_of_birth)
    }

    if (updateData.name) {
      const nameParts = updateData.name.trim().split(" ")
      updateData.first_name = nameParts[0]
      updateData.last_name = nameParts.slice(1).join(" ") || ""
      delete updateData.name
    }

    if (updateData.email) {
      updateData.email_id = updateData.email
      delete updateData.email
    }

    if (updateData.phone) {
      updateData.contact_number = updateData.phone
      delete updateData.phone
    }

    const updatedStudent = await studentClient.student.update({
      where: { student_id: BigInt(id) },
      data: updateData,
      include: {
        attendance: { take: 10, orderBy: { date: "desc" } },
        marks: { take: 10, orderBy: { created_at: "desc" } },
        assignment: { take: 5, orderBy: { created_at: "desc" } },
        studentNotification: { take: 5, orderBy: { created_at: "desc" } },
      },
    })

    await studentClient.studentNotification.create({
      data: {
        student_id: updatedStudent.student_id,
        title: "Profile Updated",
        message: "Your profile information has been updated by the administrator.",
        type: "Info",
        isRead: false,
      },
    })

    const responseData = {
      ...updatedStudent,
      student_id: updatedStudent.student_id.toString(),
      id: updatedStudent.student_id.toString(),
      name: `${updatedStudent.first_name} ${updatedStudent.last_name}`,
      email: updatedStudent.email_id,
      phone: updatedStudent.contact_number,
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ success: false, error: "Failed to update student" }, { status: 500 })
  }
}

// ===== DELETE: Remove student and related records =====
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: "Student ID is required" }, { status: 400 })
    }

    const student = await studentClient.student.findUnique({
      where: { student_id: BigInt(id) },
    })

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 })
    }

    await Promise.all([
      studentClient.studentNotification.deleteMany({ where: { student_id: BigInt(id) } }),
      studentClient.studentAttendance.deleteMany({ where: { student_id: BigInt(id) } }),
      studentClient.studentMarks.deleteMany({ where: { student_id: BigInt(id) } }),
      studentClient.studentAssignment.deleteMany({ where: { student_id: BigInt(id) } }),
    ])

    await studentClient.student.delete({
      where: { student_id: BigInt(id) },
    })

    return NextResponse.json({
      success: true,
      message: `Student ${student.first_name} ${student.last_name} has been deleted successfully.`,
    })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ success: false, error: "Failed to delete student" }, { status: 500 })
  }
}
