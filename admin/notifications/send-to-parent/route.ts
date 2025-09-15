import { type NextRequest, NextResponse } from "next/server"
import { parentClient } from "@/lib/database-clients"

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/admin/notifications/send-to-parents - Starting")

    const { notificationId, title, message, department, section, priority } = await request.json()

    console.log("Sending to parents:", { notificationId, title, department, section })

    if (!notificationId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    try {
      // Get parents based on student filters
      const whereClause: any = {}

      if (department && department !== "All Departments") {
        whereClause.student = {
          department: department,
        }
      }

      if (section && section !== "All Sections") {
        whereClause.student = {
          ...whereClause.student,
          section: section,
        }
      }

      const parents = await parentClient.parent.findMany({
        where: whereClause,
        include: {
          children: true,
        },
      })

      console.log(`Found ${parents.length} parents to notify`)

      // Create individual notifications for each parent
      const parentNotifications = await Promise.all(
        parents.map((parent) =>
          parentClient.parentNotification.create({
            data: {
              parent_id: parent.parent_id,
              title,
              message,
              type: "General", // or another appropriate type value
              priority: priority || "Normal",
              is_read: false,
            },
          }),
        ),
      )

      console.log(`Created ${parentNotifications.length} parent notifications`)

      return NextResponse.json({
        success: true,
        count: parentNotifications.length,
        message: `Notification sent to ${parentNotifications.length} parents`,
      })
    } catch (dbError) {
      console.error("Database error sending to parents:", dbError)
      return NextResponse.json(
        {
          error: "Failed to send notifications to parents",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error sending notifications to parents:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
