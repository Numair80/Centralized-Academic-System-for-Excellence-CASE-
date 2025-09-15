import { type NextRequest, NextResponse } from "next/server"
import { parentClient } from "@/lib/database-clients"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parentId = params.id

    if (!parentId) {
      return NextResponse.json({ success: false, error: "Parent ID is required" }, { status: 400 })
    }

    // Get parent details before deletion
    const parent = await parentClient.parent.findUnique({
      where: { parent_id: Number.parseInt(parentId) },
    })

    if (!parent) {
      return NextResponse.json({ success: false, error: "Parent not found" }, { status: 404 })
    }

    // Delete related records first
    await parentClient.parentChild.deleteMany({
      where: { parent_id: Number.parseInt(parentId) },
    })

    // Delete the parent
    await parentClient.parent.delete({
      where: { parent_id: Number.parseInt(parentId) },
    })

    return NextResponse.json({
      success: true,
      message: `Parent ${parent.first_name} ${parent.last_name} has been deleted successfully.`,
    })
  } catch (error) {
    console.error("Error deleting parent:", error)
    return NextResponse.json({ success: false, error: "Failed to delete parent" }, { status: 500 })
  }
}
