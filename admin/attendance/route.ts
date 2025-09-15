import { type NextRequest, NextResponse } from "next/server"
import { studentClient } from "@/lib/database-clients"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")
    const semester = searchParams.get("semester")
    const section = searchParams.get("section")
    const date = searchParams.get("date")
    const subject = searchParams.get("subject")

    // Build where clause
    const whereClause: any = {}

    if (date) {
      const selectedDate = new Date(date)
      whereClause.date = {
        gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        lte: new Date(selectedDate.setHours(23, 59, 59, 999)),
      }
    }

    if (subject) {
      whereClause.subject_id = BigInt(subject)
    }

    // Include student information
    whereClause.student = {}

    if (department) {
      whereClause.student.department = department
    }

    if (semester) {
      whereClause.student.semester = Number.parseInt(semester)
    }

    if (section) {
      whereClause.student.section = section
    }

    // Fetch attendance records
    const attendance = await studentClient.studentAttendance.findMany({
      where: whereClause,
      include: {
        student: true,
      },
      orderBy: [{ date: "desc" }, { student: { first_name: "asc" } }],
    })

    // Transform data for frontend
    const transformedAttendance = attendance.map((record) => ({
      id: record.id.toString(),
      studentId: record.student_id.toString(),
      studentName: `${record.student.first_name} ${record.student.last_name}`,

      date: record.date.toISOString().split("T")[0],
      status: record.status,
      
      department: record.student.department,
      semester: record.student.semester,
      section: record.student.section,
    }))

    return NextResponse.json({
      attendance: transformedAttendance,
    })
  } catch (error) {
    console.error("Error fetching attendance records:", error)
    return NextResponse.json({ error: "Failed to fetch attendance records" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get attendance data from request body
    const { studentId, subjectId, date, status, remarks, bulkData, formData } = await request.json()

    // Handle bulk attendance update
    if (bulkData && Array.isArray(bulkData)) {
      const results = []

      for (const item of bulkData) {
        try {
          // Check if attendance record already exists
          const existingRecord = await studentClient.studentAttendance.findFirst({
            where: {
              student_id: BigInt(item.studentId),

              date: new Date(item.date),
            },
          })

          let record

          if (existingRecord) {
            // Update existing record
            record = await studentClient.studentAttendance.update({
              where: {
                id: existingRecord.id,
              },
              data: {
                status: item.status,
              },
            })
          } else {
            // Create new record
            record = await studentClient.studentAttendance.create({
              data: {
                student_id: BigInt(item.studentId),
                subject: item.subjectName || "General",
                date: new Date(item.date),
                status: item.status,
                
              },
            })
          }

          results.push({
            success: true,
            id: record.id.toString(),
            studentId: item.studentId,
          })

          // Create notification for the student
          await studentClient.studentNotification.create({
            data: {
              student_id: BigInt(item.studentId),
              title: "Attendance Updated",
              message: `Your attendance for ${item.subjectName || "a subject"} on ${item.date} has been marked as ${item.status}.`,
              type: "Attendance",
              isRead: false,
            },
          })
        } catch (error) {
          console.error(`Error updating attendance for student ${item.studentId}:`, error)
          results.push({
            success: false,
            studentId: item.studentId,
            error: "Failed to update attendance",
          })
        }
      }

      return NextResponse.json({
        success: true,
        results,
      })
    }

    // Handle single attendance update
    if (!studentId || !date || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get or create a default subject if subjectId is not provided
    let finalSubjectId = subjectId
    if (!finalSubjectId) {
      // Try to find a subject by name, or create a default one
      try {
        let subject = await studentClient.subject.findFirst({
          where: {
            name: {
              contains: formData?.subject || "General",
              mode: "insensitive",
            },
          },
        })

        if (!subject) {
          // Create a default subject if none exists
          subject = await studentClient.subject.create({
            data: {
              subject_code: (formData?.subject || "General").replace(/\s+/g, "_").toUpperCase(),
              name: formData?.subject || "General",
              credits: 3,
            },
          })
        }

        finalSubjectId = subject.id.toString()
      } catch (error) {
        console.error("Error handling subject:", error)
        finalSubjectId = "1" // fallback
      }
    }

    // Check if attendance record already exists
    const existingRecord = await studentClient.studentAttendance.findFirst({
      where: {
        student_id: BigInt(studentId),
        
        date: new Date(date),
      },
    })

    let record

    if (existingRecord) {
      // Update existing record
      record = await studentClient.studentAttendance.update({
        where: {
          id: existingRecord.id,
        },
        data: {
          status,
        },
      })
    }

    // Get subject name for notification
    const subject = await studentClient.subject.findUnique({
      where: {
        id: BigInt(finalSubjectId),
      },
    })

    // Create notification for the student
    await studentClient.studentNotification.create({
      data: {
        student_id: BigInt(studentId),
        title: "Attendance Updated",
        message: `Your attendance for ${subject?.name || "a subject"} on ${date} has been marked as ${status}.`,
        type: "Attendance",
        isRead: false,
      },
    })

    return NextResponse.json({
      success: true,
      id: record ? record.id.toString() : null,
    })
  } catch (error) {
    console.error("Error updating attendance:", error)
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 })
  }
}
