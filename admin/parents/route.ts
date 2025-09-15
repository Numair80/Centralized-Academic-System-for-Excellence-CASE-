import { type NextRequest, NextResponse } from "next/server"
import { parentClient } from "@/lib/database-clients"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const department = searchParams.get("department")

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { child_email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { contact_number: { contains: search, mode: "insensitive" } },
        { relationship: { contains: search, mode: "insensitive" } },
      ]
    }

    const parents = await parentClient.parent.findMany({
      where: whereClause,
      include: {
        children: true,
      },
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
    })

    // Transform data to match the expected format
    let transformedParents = parents.map((parent) => {
      // Get the primary child's department for the parent's department
      const primaryChild = parent.children && parent.children.length > 0 ? parent.children[0] : null

      return {
        id: parent.parent_id,
        name: `${parent.first_name} ${parent.last_name}`,
        email: parent.child_email || "N/A",
        phone: parent.contact_number || "N/A",
        department: parent.department || primaryChild?.child_department || null,
        linkedStudents: (parent.children || []).map((child) => ({
          id: Number.parseInt(child.child_student_id.toString()),
          name: child.child_name || "Unknown",
          department: child.child_department || "Unknown",
        })),
      }
    })

    // Filter by department if specified
    if (department && department !== "all") {
      transformedParents = transformedParents.filter((parent) => parent.department === department)
    }

    return NextResponse.json({ success: true, data: transformedParents })
  } catch (error) {
    console.error("Error fetching parents:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch parents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log("Received parent data:", data)

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    const newParent = await parentClient.parent.create({
      data: {
        first_name: data.name?.split(" ")[0] || data.first_name,
        last_name: data.name?.split(" ").slice(1).join(" ") || data.last_name || "",
        username: data.username,
        password_hash: hashedPassword,
        child_email: data.email,
        contact_number: data.phone || data.contact_number,
        
        department: data.department || null,
      },
      include: {
        children: true,
      },
    })

    const responseData = {
      id: newParent.parent_id,
      name: `${newParent.first_name} ${newParent.last_name}`,
      email: newParent.child_email,
      phone: newParent.contact_number,
      department: newParent.department,
      linkedStudents: [],
    }

    console.log("Parent created successfully:", newParent.parent_id)
    return NextResponse.json({ success: true, data: responseData }, { status: 201 })
  } catch (error) {
    console.error("Error creating parent:", error)
    return NextResponse.json({ success: false, error: "Failed to create parent" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { parent_id, id, password, children, ...updateData } = data

    const parentIdToUpdate = parent_id || id

    // Hash password if provided
    if (password && password.trim() !== "") {
      updateData.password_hash = await bcrypt.hash(password, 12)
    }

    // Handle name field
    if (updateData.name) {
      const nameParts = updateData.name.split(" ")
      updateData.first_name = nameParts[0]
      updateData.last_name = nameParts.slice(1).join(" ")
      delete updateData.name
    }

    // Handle phone field
    if (updateData.phone) {
      updateData.contact_number = updateData.phone
      delete updateData.phone
    }

    // Handle email field
    if (updateData.email) {
      updateData.child_email = updateData.email
      delete updateData.email
    }

    const updatedParent = await parentClient.parent.update({
      where: { parent_id: Number.parseInt(parentIdToUpdate) },
      data: updateData,
      include: {
        children: true,
      },
    })

    // Get the primary child's department for the parent's department
    const primaryChild = updatedParent.children && updatedParent.children.length > 0 ? updatedParent.children[0] : null

    const responseData = {
      id: updatedParent.parent_id,
      name: `${updatedParent.first_name} ${updatedParent.last_name}`,
      email: updatedParent.child_email,
      phone: updatedParent.contact_number,
      department: updatedParent.department || primaryChild?.child_department || null,
      linkedStudents: (updatedParent.children || []).map((child) => ({
        id: Number.parseInt(child.child_student_id.toString()),
        name: child.child_name || "Unknown",
        department: child.child_department || "Unknown",
      })),
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error("Error updating parent:", error)
    return NextResponse.json({ success: false, error: "Failed to update parent" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get("parentId")

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
