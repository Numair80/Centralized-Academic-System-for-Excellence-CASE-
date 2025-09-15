"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParent } from "@/contexts/parent-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, ChevronDown, ChevronUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Notification = {
  id: number
  title: string
  content: string
  date: string
  isRead: boolean
}

// Mock notifications data
const notificationsData: Record<string, Notification[]> = {
  "160421737049": [
    {
      id: 1,
      title: "Upcoming Parent-Teacher Meeting",
      content: "Please attend the parent-teacher meeting scheduled for July 25th at 3 PM.",
      date: "2023-07-15",
      isRead: false,
    },
    {
      id: 2,
      title: "School Closure Notice",
      content: "The school will be closed on July 20th due to maintenance work.",
      date: "2023-07-14",
      isRead: false,
    },
    {
      id: 3,
      title: "New Curriculum Announcement",
      content: "We are excited to announce updates to our science curriculum starting next semester.",
      date: "2023-07-10",
      isRead: true,
    },
  ],
  "160421737031": [
    {
      id: 1,
      title: "Sports Day Reminder",
      content:
        "Don't forget, our annual Sports Day is coming up on August 5th. All students are encouraged to participate.",
      date: "2023-07-05",
      isRead: true,
    },
    {
      id: 2,
      title: "Fee Payment Reminder",
      content: "This is a reminder that the next installment of fees is due on July 15th.",
      date: "2023-07-01",
      isRead: false,
    },
  ],
  "160421737028": [
    {
      id: 1,
      title: "Academic Excellence Award",
      content:
        "Congratulations! Your child has been selected for the Academic Excellence Award for outstanding performance in the last semester.",
      date: "2023-07-10",
      isRead: false,
    },
    {
      id: 2,
      title: "Career Counseling Session",
      content: "A career counseling session has been scheduled for final year students on July 20th.",
      date: "2023-07-05",
      isRead: true,
    },
    {
      id: 3,
      title: "Library Book Return Reminder",
      content: "Please remind your child to return borrowed library books by July 15th.",
      date: "2023-07-01",
      isRead: true,
    },
  ],
}

export default function NotificationsPage() {
  const { parent, selectedChild, isLoading } = useParent()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !parent) {
      router.push("/parent-dashboard/notifications")
      return
    }

    // Load notifications for the selected child
    if (selectedChild) {
      setNotifications(notificationsData[selectedChild.student_id] || [])
    }
  }, [isLoading, parent, selectedChild, router])

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
  }

  if (isLoading) {
    return <NotificationsSkeleton />
  }

  if (!parent || !selectedChild) {
    return null // Will redirect to login
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold mb-2">Notifications & Announcements</h2>
      <p className="text-muted-foreground mb-6">
        Viewing notifications for <span className="font-medium text-foreground">{selectedChild.first_name}</span>
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg transition-colors duration-200 ${
                    notification.isRead ? "bg-accent" : "bg-blue-50 dark:bg-blue-900/20"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Bell className={`w-5 h-5 ${notification.isRead ? "text-gray-400" : "text-blue-500"}`} />
                      <h3 className="font-medium">{notification.title}</h3>
                    </div>
                    {!notification.isRead && (
                      <Badge variant="secondary" className="cursor-pointer" onClick={() => markAsRead(notification.id)}>
                        Mark as read
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.date}</p>
                  {expandedId === notification.id ? (
                    <p className="mt-2 text-gray-700">{notification.content}</p>
                  ) : (
                    <p className="mt-2 text-gray-700 line-clamp-2">{notification.content}</p>
                  )}
                  <button
                    className="mt-2 text-blue-500 flex items-center"
                    onClick={() => toggleExpand(notification.id)}
                  >
                    {expandedId === notification.id ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Show more
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No notifications available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-48 mb-6" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
