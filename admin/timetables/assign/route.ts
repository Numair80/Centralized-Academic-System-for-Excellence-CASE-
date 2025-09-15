import { type NextRequest, NextResponse } from "next/server"
import { TimetableSync } from "@/lib/timetable-sync"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Assignment request body:", body)

    // Validate required fields
    if (!body.timetable_id || body.timetable_id.trim() === "") {
      return NextResponse.json({ success: false, error: "timetable_id is required" }, { status: 400 })
    }

    if (!body.assignment_type || body.assignment_type.trim() === "") {
      return NextResponse.json({ success: false, error: "assignment_type is required" }, { status: 400 })
    }

    // Validate assignment type specific requirements
    if (body.assignment_type.toLowerCase() === "department" || body.assignment_type === "DEPARTMENT") {
      if (!body.target_department || body.target_department.trim() === "") {
        return NextResponse.json(
          { success: false, error: "target_department is required for department assignments" },
          { status: 400 },
        )
      }
    }

    if (body.assignment_type.toLowerCase() === "faculty" || body.assignment_type === "FACULTY") {
      if (!body.faculty_id || body.faculty_id.trim() === "") {
        return NextResponse.json(
          { success: false, error: "faculty_id is required for faculty assignments" },
          { status: 400 },
        )
      }
    }

    // Prepare assignment data with proper validation
    const assignmentData = {
      id: body.id || `assign_${Date.now()}`,
      timetable_id: body.timetable_id.trim(),
      assignment_type: body.assignment_type.trim(),
      target_department: body.target_department?.trim() || null,
      target_semester: body.target_semester?.trim() || null,
      target_section: body.target_section?.trim() || null,
      faculty_id: body.faculty_id?.trim() || null,
      faculty_name: body.faculty_name?.trim() || null,
    }

    console.log("Processed assignment data:", assignmentData)

    const result = await TimetableSync.assignTimetable(assignmentData)

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          assignment: result.assignment,
          message: "Timetable assigned successfully",
        },
        { status: 201 },
      )
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
