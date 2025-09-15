"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Trash2, Check, AlertCircle, Info, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: number
  student_id: string
  title: string
  message: string
  type: string
  priority: string
  is_read: boolean
  created_at: string
  updated_at: string
}

const NotificationCard = ({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification
  onMarkAsRead: (id: number) => void
  onDelete: (id: number) => void
}) => {
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`mb-4 transition-all duration-200 hover:shadow-md ${
          notification.is_read ? "bg-gray-50 border-gray-200" : "bg-white border-blue-200 shadow-sm"
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getTypeIcon(notification.type)}
              <CardTitle className={`text-lg ${notification.is_read ? "text-gray-600" : "text-gray-900"}`}>
                {notification.title}
              </CardTitle>
              {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getTypeColor(notification.type)}>
                {notification.type}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                {notification.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`mb-4 ${notification.is_read ? "text-gray-600" : "text-gray-800"}`}>{notification.message}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {new Date(notification.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <div className="flex gap-2">
              {!notification.is_read && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark as Read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/student-interface/notifications", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setNotifications(data.notifications || [])
      } else {
        throw new Error(data.error || "Failed to fetch notifications")
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch notifications")
      toast({
        title: "Error",
        description: "Failed to fetch notifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch("/api/student-interface/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          notificationId,
          action: "mark_read",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ? { ...notification, is_read: true } : notification,
          ),
        )
        toast({
          title: "Success",
          description: "Notification marked as read",
        })
      } else {
        throw new Error(data.error || "Failed to mark notification as read")
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (notificationId: number) => {
    try {
      const response = await fetch("/api/student-interface/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          notificationId,
          action: "delete",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))
        toast({
          title: "Success",
          description: "Notification deleted successfully",
        })
      } else {
        throw new Error(data.error || "Failed to delete notification")
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchNotifications} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
        </div>
        <Button onClick={fetchNotifications} variant="outline">
          Refresh
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
          <p className="text-gray-500">You'll see your notifications here when you receive them.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
