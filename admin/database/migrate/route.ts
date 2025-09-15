import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function POST() {
  try {
    const schemas = [
      "staff-schema.prisma",
      "student-schema.prisma",
      "parent-schema.prisma",
      "notes-schema.prisma",
      "events-schema.prisma",
      "feedback-schema.prisma",
    ]

    const results = []

    for (const schema of schemas) {
      try {
        console.log(`Running migration for ${schema}...`)
        execSync(`npx prisma migrate deploy --schema=prisma/${schema}`, {
          stdio: "pipe",
          cwd: process.cwd(),
        })
        results.push({ schema, status: "success" })
      } catch (error) {
        console.error(`Migration failed for ${schema}:`, error)
        results.push({ schema, status: "failed", error: error.message })
      }
    }

    const allSuccessful = results.every((result) => result.status === "success")

    return NextResponse.json({
      success: allSuccessful,
      results,
      message: allSuccessful ? "All migrations completed successfully" : "Some migrations failed",
    })
  } catch (error) {
    console.error("Error running migrations:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run migrations",
      },
      { status: 500 },
    )
  }
}
