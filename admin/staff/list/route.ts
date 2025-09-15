import { NextResponse } from "next/server"
import { staffClient } from "@/lib/database-clients"

export async function GET() {
  try {
    // Fetch all active staff members from the database using staffClient
    const staff = await staffClient.staff.findMany({
        where: {
            is_active: true, // Only fetch active staff members
        },
      select: {
        staff_id: true,
        first_name: true,
        last_name: true,
        email: true,
        department: true,
        contact_number: true,
        is_active: true,
      },
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
    })

    const formattedStaff = staff.map((member) => ({
      id: member.staff_id,
      staff_id: member.staff_id,
      name: `${member.first_name} ${member.last_name}`,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      department: member.department,
      phone: member.contact_number,
      status: member.is_active ? "Active" : "Inactive",
    }))

    return NextResponse.json({
      success: true,
      staff: formattedStaff,
      count: formattedStaff.length,
    })
  } catch (error) {
    console.error("Error fetching staff list:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch staff list",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
