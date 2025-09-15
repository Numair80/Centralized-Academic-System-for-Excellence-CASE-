import { NextResponse } from "next/server"
import {
  staffClient,
  studentClient,
  parentClient,
  notesClient,
  eventsClient,
  feedbackClient,
} from "@/lib/database-clients"

export async function GET() {
  try {
    // Get actual stats from all databases
    const [staffCount, studentCount, parentCount, notesCount, eventsCount, feedbackCount, recentActivity] =
      await Promise.all([
        staffClient.staff.count({ where: { is_active: true } }),
        studentClient.student.count(),
        parentClient.parent.count({ where: { is_active: true } }),
        notesClient.note.count({ where: { is_active: true } }),
        eventsClient.event.count(),
        feedbackClient.feedback.count(),
        getRecentActivity(),
      ])

    const stats = {
      overview: {
        totalStaff: staffCount,
        totalStudents: studentCount,
        totalParents: parentCount,
        totalNotes: notesCount,
        totalEvents: eventsCount,
        totalFeedback: feedbackCount,
      },
      activity: {
        recentActivity,
      },
      growth: {
        staffGrowth: 5.2,
        studentGrowth: 12.8,
        notesGrowth: 23.4,
        eventsGrowth: 8.7,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 })
  }
}

async function getRecentActivity() {
  try {
    const [recentNotes, recentEvents, recentFeedback, recentStudents, recentStaff] = await Promise.all([
      notesClient.note.findMany({
        take: 3,
        orderBy: { upload_date: "desc" },
        select: {
          title: true,
          uploaded_by: true,
          upload_date: true,
          subject: true,
        },
      }),
      eventsClient.event.findMany({
        take: 3,
        orderBy: { created_at: "desc" },
        select: {
          title: true,
          created_by: true,
          created_at: true,
          event_date: true,
        },
      }),
      feedbackClient.feedback.findMany({
        take: 3,
        orderBy: { submitted_at: "desc" },
        select: {
          subject: true,
          name: true,
          submitted_at: true,
          category: true,
        },
      }),
      studentClient.student.findMany({
        take: 2,
        orderBy: { created_at: "desc" },
        select: {
          first_name: true,
          last_name: true,
          created_at: true,
          department: true,
        },
      }),
      staffClient.staff.findMany({
        take: 2,
        orderBy: { created_at: "desc" },
        select: {
          first_name: true,
          last_name: true,
          created_at: true,
          department: true,
        },
      }),
    ])

    interface NoteActivity {
      type: "note"
      title: string
      description: string
      timestamp: string
      icon: string
      color: string
    }

    interface EventActivity {
      type: "event"
      title: string
      description: string
      timestamp: string
      icon: string
      color: string
    }

    interface FeedbackActivity {
      type: "feedback"
      title: string
      description: string
      timestamp: string
      icon: string
      color: string
    }

    interface StudentActivity {
      type: "student"
      title: string
      description: string
      timestamp: string
      icon: string
      color: string
    }

    interface StaffActivity {
      type: "staff"
      title: string
      description: string
      timestamp: string
      icon: string
      color: string
    }

    type Activity =
      | NoteActivity
      | EventActivity
      | FeedbackActivity
      | StudentActivity
      | StaffActivity

    const activities: Activity[] = []

    // Add recent notes
    recentNotes.forEach((note) => {
      activities.push({
        type: "note",
        title: `New note uploaded: ${note.title}`,
        description: `${note.subject} - by ${note.uploaded_by}`,
        timestamp: formatDate(note.upload_date),
        icon: "FileText",
        color: "text-blue-500",
      })
    })

    // Add recent events
    recentEvents.forEach((event) => {
      activities.push({
        type: "event",
        title: `Event created: ${event.title}`,
        description: `Event date: ${formatDate(event.event_date)} - by ${event.created_by}`,
        timestamp: formatDate(event.created_at),
        icon: "Calendar",
        color: "text-green-500",
      })
    })

    // Add recent feedback
    recentFeedback.forEach((feedback) => {
      activities.push({
        type: "feedback",
        title: `New feedback: ${feedback.subject}`,
        description: `${feedback.category} - by ${feedback.name}`,
        timestamp: formatDate(feedback.submitted_at),
        icon: "MessageSquare",
        color: "text-purple-500",
      })
    })

    // Add recent students
    recentStudents.forEach((student) => {
      activities.push({
        type: "student",
        title: `New student enrolled: ${student.first_name} ${student.last_name}`,
        description: `Department: ${student.department}`,
        timestamp: formatDate(student.created_at),
        icon: "UserPlus",
        color: "text-orange-500",
      })
    })

    // Add recent staff
    recentStaff.forEach((staff) => {
      activities.push({
        type: "staff",
        title: `New staff member: ${staff.first_name} ${staff.last_name}`,
        description: `Department: ${staff.department}`,
        timestamp: formatDate(staff.created_at),
        icon: "UserCheck",
        color: "text-indigo-500",
      })
    })

    // Sort by timestamp and return top 10
    return activities
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime()
        const dateB = new Date(b.timestamp).getTime()
        return dateB - dateA
      })
      .slice(0, 10)
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return []
  }
}

function formatDate(date: Date | string | null): string {
  if (!date) return "Unknown time"

  try {
    const d = new Date(date)

    // Check if date is valid
    if (isNaN(d.getTime())) {
      return "Unknown time"
    }

    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`

    return d.toLocaleDateString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Unknown time"
  }
}
