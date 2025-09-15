import { NextResponse } from "next/server"
import { checkDatabaseConnections } from "@/lib/database-clients"

export async function GET() {
  try {
    const connections = await checkDatabaseConnections()

    const stats = [
      {
        name: "Staff Management",
        status: connections.staff,
        recordCount: connections.staff ? 150 : 0,
        lastUpdated: new Date().toLocaleDateString(),
        size: "2.3 MB",
      },
      {
        name: "Student Management",
        status: connections.student,
        recordCount: connections.student ? 1250 : 0,
        lastUpdated: new Date().toLocaleDateString(),
        size: "15.7 MB",
      },
      {
        name: "Parent Portal",
        status: connections.parent,
        recordCount: connections.parent ? 800 : 0,
        lastUpdated: new Date().toLocaleDateString(),
        size: "4.2 MB",
      },
      {
        name: "Notes Repository",
        status: connections.notes,
        recordCount: connections.notes ? 450 : 0,
        lastUpdated: new Date().toLocaleDateString(),
        size: "125.8 MB",
      },
      {
        name: "Events Management",
        status: connections.events,
        recordCount: connections.events ? 75 : 0,
        lastUpdated: new Date().toLocaleDateString(),
        size: "1.8 MB",
      },
      {
        name: "Feedback System",
        status: connections.feedback,
        recordCount: connections.feedback ? 320 : 0,
        lastUpdated: new Date().toLocaleDateString(),
        size: "3.1 MB",
      },
      {
        name: "Notifications System",
        status: connections.notifications,
        recordCount: connections.notifications ? 2500 : 0,
        lastUpdated: new Date().toLocaleDateString(),
        size: "8.4 MB",
      },
    ]

    return NextResponse.json({
      connections,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json({ error: "Health check failed" }, { status: 500 })
  }
}
