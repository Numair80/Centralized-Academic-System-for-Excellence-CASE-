import { type NextRequest, NextResponse } from "next/server"
import { studentClient } from "@/lib/database-clients"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Attendance record ID is required" }, { status: 400 })
    }

    // Delete the attendance record
    await studentClient.studentAttendance.delete({
      where: {
        id: Number(id),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Attendance record deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting attendance record:", error)
    return NextResponse.json({ error: "Failed to delete attendance record" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { status, remarks } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Attendance record ID is required" }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Update the attendance record
    const record = await studentClient.studentAttendance.update({
      where: {
        id: Number(id),
      },
      data: {
status,
      },
    })

    return NextResponse.json({
      success: true,
      id: record.id.toString(),
      message: "Attendance record updated successfully",
    })
  } catch (error) {
    console.error("Error updating attendance record:", error)
    return NextResponse.json({ error: "Failed to update attendance record" }, { status: 500 })
  }
}
