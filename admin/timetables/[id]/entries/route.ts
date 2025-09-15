import { type NextRequest, NextResponse } from "next/server"
import { TimetableSync } from "@/lib/timetable-sync"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entryData = await request.json()

    console.log("Received entry data:", entryData)

    // Validate required fields
    if (!entryData.subject || entryData.subject.trim() === "") {
      return NextResponse.json({ success: false, error: "Subject is required" }, { status: 400 })
    }

    // Use the new addTimetableEntry method
    const result = await TimetableSync.addTimetableEntry(params.id, entryData)

    if (result.success) {
      return NextResponse.json({ success: true, entry: result.entry }, { status: 201 })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error adding timetable entry:", error)
    return NextResponse.json({ success: false, error: "Failed to add timetable entry" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const timetable = await TimetableSync.getTimetableWithEntries(params.id)

    if (!timetable) {
      return NextResponse.json({ success: false, error: "Timetable not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, entries: timetable.entries })
  } catch (error) {
    console.error("Error getting timetable entries:", error)
    return NextResponse.json({ success: false, error: "Failed to get timetable entries" }, { status: 500 })
  }
}
