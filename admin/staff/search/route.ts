import { type NextRequest, NextResponse } from "next/server"
import { staffClient } from "@/lib/database-clients"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const department = searchParams.get("department") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Build where conditions
    const whereConditions: any = {
      status: "active",
    }

    // Add search conditions
    if (query.trim()) {
      whereConditions.OR = [
        {
          first_name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          last_name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      ]
    }

    // Add department filter
    if (department.trim()) {
      whereConditions.department = {
        equals: department,
        mode: "insensitive",
      }
    }

    const staff = await staffClient.staff.findMany({
      where: whereConditions,
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
      take: limit,
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
      status: member.is_active
    }))

    return NextResponse.json({
      success: true,
      staff: formattedStaff,
      count: formattedStaff.length,
      query: {
        search: query,
        department: department,
        limit: limit,
      },
    })
  } catch (error) {
    console.error("Error searching staff:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search staff",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
