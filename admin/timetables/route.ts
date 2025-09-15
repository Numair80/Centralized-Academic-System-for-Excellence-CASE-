import { type NextRequest, NextResponse } from "next/server"
import { TimetableSync } from "@/lib/timetable-sync"

export async function GET() {
  try {
    const timetables = await TimetableSync.getAllTimetables()
    return NextResponse.json({ success: true, timetables })
  } catch (error) {
    console.error("Error fetching timetables:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch timetables" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const timetableData = await request.json()

    console.log("Received timetable data:", timetableData)

    // Ensure we have a valid effective_from date
    if (!timetableData.effective_from || timetableData.effective_from === "") {
      timetableData.effective_from = new Date().toISOString().split("T")[0] // Current date in YYYY-MM-DD format
    }

    const result = await TimetableSync.saveTimetable(timetableData)

    if (result.success) {
      return NextResponse.json({ success: true, timetable: result.timetable }, { status: 201 })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error creating timetable:", error)
    return NextResponse.json({ success: false, error: "Failed to create timetable" }, { status: 500 })
  }
}
