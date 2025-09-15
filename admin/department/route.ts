import { NextResponse } from "next/server"
import { staffClient } from "@/lib/database-clients"

export async function GET() {
  try {
    // Fetch unique departments from staff table using staffClient
    const departments = await staffClient.staff.findMany({
      where: {
        is_active: true,
        department: {
          not: null,
        },
      },
      select: {
        department: true,
      },
      distinct: ["department"],
    })

    const departmentList = departments
      .filter((dept) => dept.department && dept.department.trim() !== "")
      .map((dept) => ({
        name: dept.department,
        value: dept.department,
      }))

    return NextResponse.json({
      success: true,
      departments: departmentList,
      count: departmentList.length,
    })
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch departments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
