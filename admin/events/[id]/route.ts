import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/generated/events-client"

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context
  const eventId = Number(params?.id)

  if (!eventId || isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
  }

  try {
    await prisma.event.delete({
      where: { id: eventId },
    })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Failed to delete event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
