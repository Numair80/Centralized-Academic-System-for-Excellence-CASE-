import { type NextRequest, NextResponse } from "next/server"
import { eventsClient, staffClient, studentClient, parentClient } from "@/lib/database-clients"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const department = searchParams.get("department")
    const search = searchParams.get("search")

    const whereClause: any = {}

    if (category && category !== "all") {
      whereClause.category = { name: category }
    }

    if (department && department !== "all") {
      whereClause.department = department
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
        { organizer: { contains: search, mode: "insensitive" } },
      ]
    }

    const events = await eventsClient.event.findMany({
      where: whereClause,
      include: {
        EventCategory: true,
        EventRegistration:true,
        EventAttendee: true,
        
        _count: {
          select: {
            EventRegistration: true,
            EventAttendee: true,
          },
        },
      },
      orderBy: { event_date: "asc" },
    })

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.event_date) {
      return NextResponse.json({ success: false, error: "Title and event date are required" }, { status: 400 })
    }

    // Get or create category
    let categoryId = data.category_id
    if (!categoryId && data.category_name) {
      const category = await eventsClient.eventCategory.upsert({
        where: { name: data.category_name },
        update: {},
        create: {
          name: data.category_name,
          description: `${data.category_name} events`,
        },
      })
      categoryId = category.id
    }

    const event = await eventsClient.event.create({
      data: {
        title: data.title,
        description: data.description,
        event_date: new Date(data.event_date),
        start_time: data.start_time ? new Date(data.start_time) : null,
        end_time: data.end_time ? new Date(data.end_time) : null,
        venue: data.venue,
        location: data.location,
        department: data.department,
        category_id: categoryId,
        organizer: data.organizer,
        contact_info: data.contact_info,
        image_url: data.image_url,
        banner_url: data.banner_url,
        max_capacity: data.max_capacity ? Number.parseInt(data.max_capacity) : null,
        registration_required: data.registration_required || false,
        registration_deadline: data.registration_deadline ? new Date(data.registration_deadline) : null,
        entry_fee: data.entry_fee ? Number.parseFloat(data.entry_fee) : null,
        priority: data.priority || "Normal",
        is_featured: data.is_featured || false,
        is_public: data.is_public !== false,
        created_by: data.created_by,
      },
      include: {
        EventCategory: true,
        _count: {
          select: {
            EventRegistration: true,
            EventAttendee: true,
          },
        },
      },
    })

    // Send notifications to relevant users based on department
    if (data.department && data.department !== "All Departments") {
      // Notify students
      const students = await studentClient.student.findMany({
        where: { department: data.department },
        select: { student_id: true },
      })

      
      // Notify staff
      const staff = await staffClient.staff.findMany({
        where: { department: data.department },
        select: { staff_id: true },
      })

      if (staff.length > 0) {
        await staffClient.staffNotification.createMany({
          data: staff.map((staffMember) => ({
            staff_id: staffMember.staff_id,
            title: `New Event: ${event.title}`,
            message: `A new event "${event.title}" has been scheduled for ${new Date(event.event_date).toLocaleDateString()}. Check the events section for more details.`,
            type: "Event",
            is_read: false,
          })),
        })
      }

      // Notify parents of students in the department
      const parentsWithChildren = await parentClient.parentChild.findMany({
        where: { child_department: data.department },
        select: { parent_id: true },
        distinct: ["parent_id"],
      })

      if (parentsWithChildren.length > 0) {
        await parentClient.parentNotification.createMany({
          data: parentsWithChildren.map((parent) => ({
            parent_id: parent.parent_id,
            title: `New Event: ${event.title}`,
            message: `A new event "${event.title}" has been scheduled for your child's department (${data.department}) on ${new Date(event.event_date).toLocaleDateString()}.`,
            type: "Event",
            is_read: false,
          })),
        })
      }
    }

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, category_name, ...updateData } = data

    // Handle category update
    if (category_name) {
      const category = await eventsClient.eventCategory.upsert({
        where: { name: category_name },
        update: {},
        create: {
          name: category_name,
          description: `${category_name} events`,
        },
      })
      updateData.category_id = category.id
    }

    // Convert date fields
    if (updateData.event_date) updateData.event_date = new Date(updateData.event_date)
    if (updateData.start_time) updateData.start_time = new Date(updateData.start_time)
    if (updateData.end_time) updateData.end_time = new Date(updateData.end_time)
    if (updateData.registration_deadline) updateData.registration_deadline = new Date(updateData.registration_deadline)

    // Convert numeric fields
    if (updateData.max_capacity) updateData.max_capacity = Number.parseInt(updateData.max_capacity)
    if (updateData.entry_fee) updateData.entry_fee = Number.parseFloat(updateData.entry_fee)

    const updatedEvent = await eventsClient.event.update({
      where: { id: Number.parseInt(id) },
      data: updateData,
      include: {
        EventCategory: true,
        EventRegistration: true,
        EventAttendee: true,
        _count: {
          select: {
            EventRegistration: true,
            EventAttendee: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: updatedEvent })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ success: false, error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 })
    }

    // Get event details before deletion
    const event = await eventsClient.event.findUnique({
      where: { id: Number.parseInt(eventId) },
    })

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Delete related records first
    await eventsClient.eventRegistration.deleteMany({
      where: { event_id: Number.parseInt(eventId) },
    })

    await eventsClient.eventAttendee.deleteMany({
      where: { event_id: Number.parseInt(eventId) },
    })

    // Delete the event
    await eventsClient.event.delete({
      where: { id: Number.parseInt(eventId) },
    })

    return NextResponse.json({
      success: true,
      message: `Event "${event.title}" has been deleted successfully.`,
    })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 })
  }
}
