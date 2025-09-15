import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Import and run the seed script
    const { default: seedScript } = await import("../../../../scripts/seed-databases")

    await seedScript()

    return NextResponse.json({
      success: true,
      message: "All databases seeded successfully",
    })
  } catch (error) {
    console.error("Error seeding databases:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed databases",
      },
      { status: 500 },
    )
  }
}
