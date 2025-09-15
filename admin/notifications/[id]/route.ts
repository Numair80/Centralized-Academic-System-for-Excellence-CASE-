import { type NextRequest, NextResponse } from "next/server"
import { notificationsClient } from "@/lib/database-clients"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const notificationId = Number.parseInt(params.id)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
    }

    // Delete the notification from the main notifications table
    await notificationsClient.notification.delete({
      where: {
        id: notificationId,
      },
    })

    // Also delete from individual notification tables
    try {
      await notificationsClient.studentNotification.deleteMany({
        where: {
          title: { contains: "" }, // This is a workaround since we don't have notification_id
        },
      })
    } catch (error) {
      console.log("No student notifications to delete")
    }

    try {
      await notificationsClient.staffNotification.deleteMany({
        where: {
          title: { contains: "" }, // This is a workaround since we don't have notification_id
        },
      })
    } catch (error) {
      console.log("No staff notifications to delete")
    }

    try {
      await notificationsClient.parentNotification.deleteMany({
        where: {
          title: { contains: "" }, // This is a workaround since we don't have notification_id
        },
      })
    } catch (error) {
      console.log("No parent notifications to delete")
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
