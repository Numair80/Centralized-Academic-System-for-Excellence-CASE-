import { type NextRequest, NextResponse } from "next/server"
import { studentClient } from "@/lib/database-clients"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")
    const search = searchParams.get("search")
    const semester = searchParams.get("semester")
    const section = searchParams.get("section")

    const whereClause: any = {}

    if (department && department !== "all") {
      whereClause.department = department
    }

    if (semester && semester !== "all") {
      whereClause.semester = Number.parseInt(semester)
    }

    if (section && section !== "all") {
      whereClause.section = section
    }

    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { email_id: { contains: search, mode: "insensitive" } },
      ]
    }

    const students = await studentClient.student.findMany({
      where: whereClause,
      include: {
        attendance: {
          take: 10,
          orderBy: { date: "desc" },
        },
        marks: {
          take: 10,
          orderBy: { created_at: "desc" },
        },
        assignment: {
          take: 5,
          orderBy: { created_at: "desc" },
        },
        
        _count: {
          select: {
            attendance: true,
            marks: true,
            assignment: true,
            
          },
        },
      },
      orderBy: [{ department: "asc" }, { semester: "asc" }, { first_name: "asc" }],
    })

    // Calculate attendance percentage for each student
    const studentsWithAttendance = students.map((student) => {
      const totalClasses = student.attendance.length
      const presentClasses = student.attendance.filter((att) => att.status === "Present").length
      const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

      return {
        ...student,
        student_id: student.student_id.toString(),
        id: student.student_id.toString(),
        name: `${student.first_name} ${student.last_name}`,
        email: student.email_id,
        phone: student.contact_number,
        attendance: attendancePercentage,
        attendancePercentage,
        totalClasses,
        presentClasses,
      }
    })

    return NextResponse.json({ success: true, data: studentsWithAttendance })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log("Received student data:", data)

    // Generate student ID if not provided
    const studentId = data.student_id || Date.now()

    // Hash password if provided
    let hashedPassword = null
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 12)
    }

    const newStudent = await studentClient.student.create({
      data: {
        student_id: BigInt(studentId),
        first_name: data.name?.split(" ")[0] || data.first_name,
        last_name: data.name?.split(" ").slice(1).join(" ") || data.last_name || "",
        email_id: data.email || data.email_id,
        password_hash: hashedPassword,
        contact_number: data.phone || data.contact_number || "",
        department: data.department,
        semester: Number.parseInt(data.semester?.replace(/\D/g, "") || "1"),
        section: data.section,
      },
      include: {
        attendance: true,
        marks: true,
        assignment: true,
        
        _count: {
          select: {
            attendance: true,
            marks: true,
            assignment: true,
            
          },
        },
      },
    })

    

    const responseData = {
      ...newStudent,
      student_id: newStudent.student_id.toString(),
      id: newStudent.student_id.toString(),
      name: `${newStudent.first_name} ${newStudent.last_name}`,
      email: newStudent.email_id,
      phone: newStudent.contact_number,
      
      attendance: 0,
    }

    console.log("Student created successfully:", newStudent.student_id)
    return NextResponse.json({ success: true, data: responseData }, { status: 201 })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ success: false, error: "Failed to create student" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { student_id, id, password, ...updateData } = data

    const studentIdToUpdate = student_id || id

    // Hash password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12)
    }

    // Convert fields
    if (updateData.semester) updateData.semester = Number.parseInt(updateData.semester?.replace(/\D/g, "") || "1")
    if (updateData.admission_year) updateData.admission_year = Number.parseInt(updateData.admission_year)
    if (updateData.date_of_birth) updateData.date_of_birth = new Date(updateData.date_of_birth)

    // Handle name field
    if (updateData.name) {
      const nameParts = updateData.name.split(" ")
      updateData.first_name = nameParts[0]
      updateData.last_name = nameParts.slice(1).join(" ")
      delete updateData.name
    }

    // Handle email field
    if (updateData.email) {
      updateData.email_id = updateData.email
      delete updateData.email
    }

    // Handle phone field
    if (updateData.phone) {
      updateData.contact_number = updateData.phone
      delete updateData.phone
    }

    const updatedStudent = await studentClient.student.update({
      where: { student_id: BigInt(studentIdToUpdate) },
      data: updateData,
      include: {
        attendance: {
          take: 10,
          orderBy: { date: "desc" },
        },
        marks: {
          take: 10,
          orderBy: { created_at: "desc" },
        },
        assignment: {
          take: 5,
          orderBy: { created_at: "desc" },
        },
        
        _count: {
          select: {
            attendance: true,
            marks: true,
            assignment: true,
            
          },
        },
      },
    })

    

    const responseData = {
      ...updatedStudent,
      student_id: updatedStudent.student_id.toString(),
      id: updatedStudent.student_id.toString(),
      name: `${updatedStudent.first_name} ${updatedStudent.last_name}`,
      email: updatedStudent.email_id,
      phone: updatedStudent.contact_number,
      status: "Active" as const,
      
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ success: false, error: "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json({ success: false, error: "Student ID is required" }, { status: 400 })
    }

    // Get student details before deletion
    const student = await studentClient.student.findUnique({
      where: { student_id: BigInt(studentId) },
    })

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 })
    }

    

    await studentClient.studentAttendance.deleteMany({
      where: { student_id: BigInt(studentId) },
    })

    await studentClient.studentMarks.deleteMany({
      where: { student_id: BigInt(studentId) },
    })

    await studentClient.studentAssignment.deleteMany({
      where: { student_id: BigInt(studentId) },
    })

    // Delete the student
    await studentClient.student.delete({
      where: { student_id: BigInt(studentId) },
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
