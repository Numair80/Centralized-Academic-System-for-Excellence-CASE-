import { type NextRequest, NextResponse } from "next/server"
import { staffClient } from "@/lib/database-clients"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    let token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      token = request.cookies.get("token")?.value
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-change-in-production")
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    if (decoded.role !== "admin" && decoded.role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { notificationId, title, message, department, priority } = await request.json()

    if (!notificationId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get staff based on filters
    const whereClause: any = {}

    if (department && department !== "All Departments") {
      whereClause.department = department
    }

    console.log("Fetching staff with filters:", whereClause)

    const staff = await staffClient.staff.findMany({
      where: whereClause,
      select: {
        staff_id: true,
        first_name: true,
        last_name: true,
        email: true,
        department: true,
      },
    })

    console.log(`Found ${staff.length} staff members to notify`)

    // Create notifications for each staff member
    const notifications = await Promise.all(
      staff.map(async (staffMember) => {
        try {
          return await staffClient.staffNotification.create({
            data: {
              staff_id: staffMember.staff_id,
              title,
              message,
              // priority: priority || "Normal", // Removed because 'priority' is not a valid property
              is_read: false,
              created_at: new Date(),
            },
          })
        } catch (error) {
          console.error(`Failed to create notification for staff ${staffMember.staff_id}:`, error)
          return null
        }
      }),
    )

    const successCount = notifications.filter((n) => n !== null).length
    const failCount = notifications.length - successCount

    console.log(`Successfully sent ${successCount} notifications to staff, ${failCount} failed`)

    return NextResponse.json({
      success: true,
      count: successCount,
      failed: failCount,
      message: `Notification sent to ${successCount} staff members`,
    })
  } catch (error) {
    console.error("Error sending notifications to staff:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
