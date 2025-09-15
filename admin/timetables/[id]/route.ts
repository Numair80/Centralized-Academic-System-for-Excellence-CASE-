import { type NextRequest, NextResponse } from "next/server"
import { TimetableSync } from "@/lib/timetable-sync"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const timetable = await TimetableSync.getTimetableWithEntries(params.id)

    if (!timetable) {
      return NextResponse.json({ success: false, error: "Timetable not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, timetable })
  } catch (error) {
    console.error("Error fetching timetable:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch timetable" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const timetableData = await request.json()

    // Ensure the ID matches
    timetableData.id = params.id

    // Ensure we have a valid effective_from date
    if (!timetableData.effective_from || timetableData.effective_from === "") {
      timetableData.effective_from = new Date().toISOString().split("T")[0]
    }

    const result = await TimetableSync.saveTimetable(timetableData)

    if (result.success) {
      return NextResponse.json({ success: true, timetable: result.timetable })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating timetable:", error)
    return NextResponse.json({ success: false, error: "Failed to update timetable" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await TimetableSync.deleteTimetable(params.id)

    if (result.success) {
      return NextResponse.json({ success: true, message: "Timetable deleted successfully" })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error deleting timetable:", error)
    return NextResponse.json({ success: false, error: "Failed to delete timetable" }, { status: 500 })
  }
}
