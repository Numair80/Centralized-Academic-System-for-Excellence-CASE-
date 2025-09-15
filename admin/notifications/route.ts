import { type NextRequest, NextResponse } from "next/server"
import { notificationsClient } from "@/lib/database-clients"

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching admin notifications...")

    const notifications = await notificationsClient.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`Found ${notifications.length} notifications`)

    // Transform the data to match the expected format
    const transformedNotifications = notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type || "info",
      priority: notification.priority || "normal",
      target_portals: notification.targetPortals || [],
      created_at: notification.createdAt.toISOString(),
      updated_at: notification.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      notifications: transformedNotifications,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Creating notification with data:", body)

    const { title, message, type = "info", priority = "normal", targetPortals = [] } = body

    if (!title || !message || !targetPortals?.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, message, and targetPortals are required",
        },
        { status: 400 },
      )
    }

    // Create the main notification
    const notification = await notificationsClient.notification.create({
      data: {
        title,
        message,
        type,
        priority,
        targetPortals,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    console.log("Created main notification:", notification)

    let totalRecipients = 0

    // Create individual notifications for each target portal
    for (const portal of targetPortals) {
      console.log(`Processing portal: ${portal}`)

      if (portal === "students") {
        try {
          // Create notifications for sample student IDs (1-5)
          // In production, you would fetch actual student IDs from the database
          const studentIds = [1, 2, 3, 4, 5]

          for (const studentId of studentIds) {
            await notificationsClient.studentNotification.create({
              data: {
                studentId,
                title,
                message,
                type,
                priority,
                department: "General",
                section: "All",
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            })
          }
          totalRecipients += studentIds.length
          console.log(`Created ${studentIds.length} student notifications`)
        } catch (error) {
          console.error("Error creating student notifications:", error)
        }
      }

      if (portal === "staff") {
        try {
          // Create notifications for sample staff IDs (1-3)
          const staffIds = [1, 2, 3]

          for (const staffId of staffIds) {
            await notificationsClient.staffNotification.create({
              data: {
                staffId,
                title,
                message,
                type,
                priority,
                department: "General",
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            })
          }
          totalRecipients += staffIds.length
          console.log(`Created ${staffIds.length} staff notifications`)
        } catch (error) {
          console.error("Error creating staff notifications:", error)
        }
      }

      if (portal === "parents") {
        try {
          // Create notifications for sample parent IDs (1-3)
          const parentIds = [1, 2, 3]

          for (const parentId of parentIds) {
            await notificationsClient.parentNotification.create({
              data: {
                parentId,
                title,
                message,
                type,
                priority,
                department: "General",
                section: "All",
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            })
          }
          totalRecipients += parentIds.length
          console.log(`Created ${parentIds.length} parent notifications`)
        } catch (error) {
          console.error("Error creating parent notifications:", error)
        }
      }
    }

    console.log(`Total recipients: ${totalRecipients}`)

    return NextResponse.json({
      success: true,
      message: "Notification created and sent successfully",
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        target_portals: notification.targetPortals,
        created_at: notification.createdAt.toISOString(),
        updated_at: notification.updatedAt.toISOString(),
      },
      recipients: totalRecipients,
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
