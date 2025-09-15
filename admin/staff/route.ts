import { type NextRequest, NextResponse } from "next/server"
import { staffClient } from "@/lib/database-clients"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    const whereClause: any = {}

    if (department && department !== "all") {
      whereClause.department = department
    }

    if (status && status !== "all") {
      whereClause.availability = status
    }

    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ]
    }

    const staff = await staffClient.staff.findMany({
      where: whereClause,
      include: {
        attendance: {
          take: 10,
          orderBy: { date: "desc" },
        },
        leave: {
          take: 5,
          orderBy: { applied_at: "desc" },
        },
        StaffNotification: {
          take: 5,
          orderBy: { created_at: "desc" },
        },
        _count: {
          select: {
            attendance: true,
            leave: true,
            StaffNotification: true,
          },
        },
      },
      orderBy: [{ department: "asc" }, { first_name: "asc" }],
    })

    return NextResponse.json({ success: true, data: staff })
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch staff" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log("Received staff data:", data)

    // Hash password if provided
    let hashedPassword = null
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 12)
    }

    const newStaff = await staffClient.staff.create({
      data: {
        first_name: data.firstName || data.first_name,
        last_name: data.lastName || data.last_name,
        username: data.username,
        password_hash: hashedPassword,
        email: data.email,
        contact_number: data.phone || data.contact_number,
        department: data.department,
        block_number: data.blockNumber || data.block_number || "A",
        room_number: data.roomNumber || data.room_number || "101",
        role: data.role || "Faculty",
        profile_picture: data.profile_picture,
        availability: data.availability || "Available",
      },
      include: {
        attendance: true,
        leave: true,
        StaffNotification: true,
        _count: {
          select: {
            attendance: true,
            leave: true,
            StaffNotification: true,
          },
        },
      },
    })

    // Create notification for new staff member
    await staffClient.staffNotification.create({
      data: {
        staff_id: newStaff.staff_id,
        title: "Welcome to the Team!",
        message: `Welcome ${newStaff.first_name}! Your account has been created successfully.`,
        type: "Info",
        is_read: false,
      },
    })

    console.log("Staff created successfully:", newStaff.staff_id)
    return NextResponse.json({ success: true, data: newStaff }, { status: 201 })
  } catch (error) {
    console.error("Error creating staff:", error)
    return NextResponse.json({ success: false, error: "Failed to create staff member" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { staff_id, password, ...updateData } = data

    // Hash password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12)
    }

    // Convert numeric fields
    if (updateData.salary) updateData.salary = Number.parseFloat(updateData.salary)
    if (updateData.experience) updateData.experience = Number.parseInt(updateData.experience)
    if (updateData.hire_date) updateData.hire_date = new Date(updateData.hire_date)

    const updatedStaff = await staffClient.staff.update({
      where: { staff_id: Number.parseInt(staff_id) },
      data: updateData,
      include: {
        attendance: {
          take: 10,
          orderBy: { date: "desc" },
        },
        leave: {
          take: 5,
          orderBy: { applied_at: "desc" },
        },
        StaffNotification: {
          take: 5,
          orderBy: { created_at: "desc" },
        },
        _count: {
          select: {
            attendance: true,
            leave: true,
            StaffNotification: true,
          },
        },
      },
    })

    // Create notification for staff update
    await staffClient.staffNotification.create({
      data: {
        staff_id: updatedStaff.staff_id,
        title: "Profile Updated",
        message: "Your profile information has been updated by the administrator.",
        type: "Info",
        is_read: false,
      },
    })

    return NextResponse.json({ success: true, data: updatedStaff })
  } catch (error) {
    console.error("Error updating staff:", error)
    return NextResponse.json({ success: false, error: "Failed to update staff member" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    if (!staffId) {
      return NextResponse.json({ success: false, error: "Staff ID is required" }, { status: 400 })
    }

    // Get staff details before deletion for notification
    const staff = await staffClient.staff.findUnique({
      where: { staff_id: Number.parseInt(staffId) },
    })

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 })
    }

    // Delete related records first (due to foreign key constraints)
    await staffClient.staffNotification.deleteMany({
      where: { staff_id: Number.parseInt(staffId) },
    })

    await staffClient.staffAttendance.deleteMany({
      where: { staff_id: Number.parseInt(staffId) },
    })

    await staffClient.staffLeave.deleteMany({
      where: { staff_id: Number.parseInt(staffId) },
    })


    // Delete the staff member
    await staffClient.staff.delete({
      where: { staff_id: Number.parseInt(staffId) },
    })

    return NextResponse.json({
      success: true,
      message: `Staff member ${staff.first_name} ${staff.last_name} has been deleted successfully.`,
    })
  } catch (error) {
    console.error("Error deleting staff:", error)
    return NextResponse.json({ success: false, error: "Failed to delete staff member" }, { status: 500 })
  }
}
