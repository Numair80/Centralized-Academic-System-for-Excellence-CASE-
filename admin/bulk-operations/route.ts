import { type NextRequest, NextResponse } from "next/server"
import { studentClient, staffClient } from "@/lib/database-clients"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { operation, type, data, filters } = await request.json()

    switch (operation) {
      case "bulk_update_attendance":
        return await bulkUpdateAttendance(data)
      case "bulk_send_notifications":
        return await bulkSendNotifications(type, data)
      case "bulk_update_status":
        return await bulkUpdateStatus(type, data)
      case "bulk_import_users":
        return await bulkImportUsers(type, data)
      case "bulk_delete_users":
        return await bulkDeleteUsers(type, data)
      default:
        return NextResponse.json({ success: false, error: "Invalid operation" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in bulk operation:", error)
    return NextResponse.json({ success: false, error: "Bulk operation failed" }, { status: 500 })
  }
}

async function bulkUpdateAttendance(
  attendanceData: Array<{ studentId: string; date: string; status: string; subject: string }>,
) {
  try {
    const results = []

    for (const record of attendanceData) {
      try {
        const attendance = await studentClient.studentAttendance.create({
          data: {
            student_id: BigInt(record.studentId),
            date: new Date(record.date),
            status: record.status as "Present" | "Absent" | "Late",
            subject: record.subject,
            marked_by: "Admin",
            created_at: new Date(),
          },
        })

        // Create notification for student
        await studentClient.studentNotification.create({
          data: {
            student_id: BigInt(record.studentId),
            title: "Attendance Updated",
            message: `Your attendance for ${record.subject} on ${record.date} has been marked as ${record.status}.`,
            type: "Info",
            isRead: false,
          },
        })

        results.push({ studentId: record.studentId, success: true })
      } catch (error) {
        console.error(`Error updating attendance for student ${record.studentId}:`, error)
        results.push({ studentId: record.studentId, success: false, error: error instanceof Error ? error.message : String(error) })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Bulk attendance update completed. ${successCount} successful, ${failureCount} failed.`,
      results,
    })
  } catch (error) {
    console.error("Error in bulk attendance update:", error)
    return NextResponse.json({ success: false, error: "Failed to update attendance" }, { status: 500 })
  }
}

async function bulkSendNotifications(
  type: string,
  notificationData: { title: string; message: string; recipients?: string[] },
) {
  try {
    const { title, message, recipients } = notificationData
    const results = []

    if (type === "students") {
      let students
      if (recipients && recipients.length > 0) {
        students = await studentClient.student.findMany({
          where: {
            student_id: { in: recipients.map((id) => BigInt(id)) },
            
          },
        })
      } else{
        students = await studentClient.student.findMany({
            where:{}
        })
      }

      for (const student of students) {
        try {
          await studentClient.studentNotification.create({
            data: {
              student_id: student.student_id,
              title,
              message,
              type: "Info",
              isRead: false,
            },
          })
          results.push({ id: student.student_id.toString(), success: true })
        } catch (error) {
          results.push({ id: student.student_id.toString(), success: false, error: error instanceof Error ? error.message : String(error) })
        }
      }
    } else if (type === "staff") {
      let staff
      if (recipients && recipients.length > 0) {
        staff = await staffClient.staff.findMany({
          where: {
            staff_id: { in: recipients.map((id) => Number(id)) },
            is_active: true,
          },
        })
      } else {
        staff = await staffClient.staff.findMany({
          where: { is_active: true },
        })
      }

      for (const member of staff) {
        try {
          await staffClient.staffNotification.create({
            data: {
              staff_id: member.staff_id,
              title,
              message,
              type: "Info",
              is_read: false,
            },
          })
          results.push({ id: member.staff_id.toString(), success: true })
        } catch (error) {
          results.push({ id: member.staff_id.toString(), success: false, error: error instanceof Error ? error.message : String(error) })
        }
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Bulk notification sent. ${successCount} successful, ${failureCount} failed.`,
      results,
    })
  } catch (error) {
    console.error("Error in bulk notification:", error)
    return NextResponse.json({ success: false, error: "Failed to send notifications" }, { status: 500 })
  }
}

async function bulkUpdateStatus(type: string, statusData: { status: boolean; userIds: string[] }) {
  try {
    const { status, userIds } = statusData
    const results = []

    if (type === "students") {
      for (const userId of userIds) {
        try {
          await studentClient.student.update({
            where: { student_id: BigInt(userId) },
            data: { updated_at: new Date()  },
          })
          results.push({ id: userId, success: true })
        } catch (error) {
          results.push({ id: userId, success: false, error: error instanceof Error ? error.message : String(error) })
        }
      }
    } else if (type === "staff") {
      for (const userId of userIds) {
        try {
          await staffClient.staff.update({
            where: { staff_id: Number(userId) },
            data: { is_active: status },
          })
          results.push({ id: userId, success: true })
        } catch (error) {
          results.push({ id: userId, success: false, error: error instanceof Error ? error.message : String(error) })
        }
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Bulk status update completed. ${successCount} successful, ${failureCount} failed.`,
      results,
    })
  } catch (error) {
    console.error("Error in bulk status update:", error)
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 })
  }
}

async function bulkImportUsers(type: string, userData: Array<any>) {
  try {
    const results = []

    if (type === "students") {
      for (const user of userData) {
        try {
          const hashedPassword = await bcrypt.hash(user.password || "defaultPassword123", 12)

          const studentData: any = {
            first_name: user.firstName,
            last_name: user.lastName,
            email_id: user.email,
            contact_number: user.phone,
            department: user.department,
            semester: Number.parseInt(user.semester),
            section: user.section,
            admission_year: user.admissionYear ? user.admissionYear : new Date().getFullYear().toString(),
            password_hash: hashedPassword,
            is_active: true,
            created_at: new Date(),
          }
          if (user.studentId) {
            studentData.student_id = BigInt(user.studentId)
          }

          const student = await studentClient.student.create({
            data: studentData,
          })

          results.push({ email: user.email, success: true, id: student.student_id.toString() })
        } catch (error) {
          results.push({ email: user.email, success: false, error: error instanceof Error ? error.message : String(error) })
        }
      }
    } else if (type === "staff") {
      for (const user of userData) {
        try {
          const hashedPassword = await bcrypt.hash(user.password || "defaultPassword123", 12)

          const staff = await staffClient.staff.create({
            data: {
              first_name: user.firstName,
              last_name: user.lastName,
              email: user.email,
              contact_number: user.phone,
              department: user.department,
              username: user.username || user.email, // Ensure username is provided
              password_hash: hashedPassword,
              is_active: true,
              created_at: new Date(),
            },
          })

          results.push({ email: user.email, success: true, id: staff.staff_id.toString() })
        } catch (error) {
          results.push({ email: user.email, success: false, error: error instanceof Error ? error.message : String(error) })
        }
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Bulk import completed. ${successCount} successful, ${failureCount} failed.`,
      results,
    })
  } catch (error) {
    console.error("Error in bulk import:", error)
    return NextResponse.json({ success: false, error: "Failed to import users" }, { status: 500 })
  }
}

async function bulkDeleteUsers(type: string, userIds: string[]) {
  try {
    const results = []

    if (type === "students") {
      for (const userId of userIds) {
        try {
          // Delete related records first
          await studentClient.studentNotification.deleteMany({
            where: { student_id: BigInt(userId) },
          })
          await studentClient.studentAttendance.deleteMany({
            where: { student_id: BigInt(userId) },
          })
          await studentClient.studentMarks.deleteMany({
            where: { student_id: BigInt(userId) },
          })
          await studentClient.studentAssignment.deleteMany({
            where: { student_id: BigInt(userId) },
          })

          // Delete the student
          await studentClient.student.delete({
            where: { student_id: BigInt(userId) },
          })

          results.push({ id: userId, success: true })
        } catch (error) {
          results.push({ id: userId, success: false, error: error instanceof Error ? error.message : String(error) })
        }
      }
    } else if (type === "staff") {
      for (const userId of userIds) {
        try {
          // Delete related records first
          await staffClient.staffNotification.deleteMany({
            where: { staff_id: Number(userId) },
          })

          // Delete the staff member
          await staffClient.staff.delete({
            where: { staff_id: Number(userId) },
          })

          results.push({ id: userId, success: true })
        } catch (error) {
          results.push({ id: userId, success: false, error: error instanceof Error ? error.message : String(error) })
        }
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Bulk delete completed. ${successCount} successful, ${failureCount} failed.`,
      results,
    })
  } catch (error) {
    console.error("Error in bulk delete:", error)
    return NextResponse.json({ success: false, error: "Failed to delete users" }, { status: 500 })
  }
}
