import { type NextRequest, NextResponse } from "next/server"
import { studentClient } from "@/lib/database-clients"

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/admin/notifications/send-to-students - Starting")

    const { notificationId, title, message, department, section, priority } = await request.json()

    console.log("Sending to students:", { notificationId, title, department, section })

    if (!notificationId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    try {
      // Get students based on filters
      const whereClause: any = {}

      if (department && department !== "All Departments") {
        whereClause.department = department
      }

      if (section && section !== "All Sections") {
        whereClause.section = section
      }

      const students = await studentClient.student.findMany({
        where: whereClause,
        select: {
          student_id: true,
          email_id: true,
          department: true,
          section: true,
        },
      })

      console.log(`Found ${students.length} students to notify`)

      // Create individual notifications for each student
      const studentNotifications = await Promise.all(
        students.map((student) =>
          studentClient.studentNotification.create({
            data: {
              student_id: student.student_id,
              title,
              message,
              priority: priority || "Normal",
              type: "admin", // or another appropriate string value
              isRead: false,
              // notificationId, // Removed because it's not a valid property
            },
          }),
        ),
      )

      console.log(`Created ${studentNotifications.length} student notifications`)

      return NextResponse.json({
        success: true,
        count: studentNotifications.length,
        message: `Notification sent to ${studentNotifications.length} students`,
      })
    } catch (dbError) {
      console.error("Database error sending to students:", dbError)
      return NextResponse.json(
        {
          error: "Failed to send notifications to students",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending notifications to students:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
