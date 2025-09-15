import { type NextRequest, NextResponse } from "next/server"
import { TimetableSync } from "@/lib/timetable-sync"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Assignment request body:", body)

    // Validate required fields
    if (!body.timetable_id) {
      return NextResponse.json({ success: false, error: "timetable_id is required" }, { status: 400 })
    }

    if (!body.assignment_type) {
      return NextResponse.json({ success: false, error: "assignment_type is required" }, { status: 400 })
    }

    // Prepare assignment data with defaults
    const assignmentData = {
      id: body.id || `assign_${Date.now()}`,
      timetable_id: body.timetable_id,
      assignment_type: body.assignment_type || "department",
      target_department: body.target_department || null,
      target_semester: body.target_semester || null,
      target_section: body.target_section || null,
      faculty_id: body.faculty_id || null,
      faculty_name: body.faculty_name || null,
    }

    console.log("Processed assignment data:", assignmentData)

    const result = await TimetableSync.assignTimetable(assignmentData)

    if (result.success) {
      return NextResponse.json({ success: true, assignment: result.assignment }, { status: 201 })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in assignment route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create assignment",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const assignments = await TimetableSync.getSyncLogs()
    return NextResponse.json({ success: true, assignments })
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch assignments" }, { status: 500 })
  }
}
