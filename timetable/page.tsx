"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, User, BookOpen, RefreshCw } from "lucide-react"

interface TimetableEntry {
  id: string
  subject: string
  faculty: string
  room: string
  time: string
  day: string
  period: number
  type: "lecture" | "lab" | "tutorial"
  semester?: string
  section?: string
}

interface Timetable {
  id: string
  name: string
  department: string
  faculty_name: string
  academic_year: string
  entries: TimetableEntry[]
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = [
  { period: 1, time: "09:00 - 09:50" },
  { period: 2, time: "09:50 - 10:40" },
  { period: 3, time: "10:40 - 11:30" },
  { period: 4, time: "11:30 - 12:20" },
  { period: 5, time: "12:20 - 13:10" },
  { period: 6, time: "13:10 - 14:00" },
  { period: 7, time: "14:00 - 14:50" },
  { period: 8, time: "14:50 - 15:40" },
]

export default function StaffTimetable() {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    loadTimetables()

    // Set up polling for real-time updates
    const interval = setInterval(loadTimetables, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadTimetables = async () => {
    try {
      // Get staff ID from session/context (you'll need to implement this)
      const staffId = "1" // Replace with actual staff ID from auth context

      const response = await fetch(`/api/staff/timetable?staffId=${staffId}`)
      const data = await response.json()

      if (data.success && data.timetables) {
        setTimetables(data.timetables)

        if (data.timetables.length > 0 && !selectedTimetable) {
          setSelectedTimetable(data.timetables[0])
        }

        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Error loading timetables:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEntryForCell = (day: string, period: number) => {
    return selectedTimetable?.entries.find((entry) => entry.day === day && entry.period === period)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lab":
        return "bg-purple-500 dark:bg-purple-600 border-purple-400 dark:border-purple-500"
      case "tutorial":
        return "bg-green-500 dark:bg-green-600 border-green-400 dark:border-green-500"
      default:
        return "bg-blue-500 dark:bg-blue-600 border-blue-400 dark:border-blue-500"
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  const transformApiDataToSchedule = (timetables: any[]): DaySchedule[] => {
    const daySchedules: { [key: string]: Class[] } = {}

    // Initialize all days
    daysOfWeek.forEach((day) => {
      daySchedules[day] = []
    })

    // Process all timetable entries with proper null checks
    timetables?.forEach((timetable) => {
      timetable?.entries?.forEach((entry: any) => {
        // Add null/undefined checks for all properties
        const day = entry?.day
        const subject = entry?.subject || "Unknown Subject"
        const room = entry?.room || "TBA"
        const faculty = entry?.faculty || "TBA"
        const time = entry?.time || "00:00"
        const type = entry?.type || "lecture"

        if (day && daySchedules[day]) {
          daySchedules[day].push({
            subject,
            duration: 1,
            room,
            type: type === "lab" ? "lab" : "lecture",
            faculty,
            time,
          })
        }
      })
    })

    // Convert to component format and sort by time
    return daysOfWeek.map((day) => ({
      day,
      classes: daySchedules[day].sort((a, b) => {
        // Safe time comparison with fallback
        const timeA = a?.time || "00:00"
        const timeB = b?.time || "00:00"
        return timeA.localeCompare(timeB)
      }),
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <motion.div className="max-w-7xl mx-auto p-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Teaching Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400">View your assigned classes and schedule</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={loadTimetables}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Timetable</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Choose your teaching schedule</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Select
                  value={selectedTimetable?.id || ""}
                  onValueChange={(value) => {
                    const timetable = timetables.find((tt) => tt.id === value)
                    setSelectedTimetable(timetable || null)
                  }}
                >
                  <SelectTrigger className="w-80 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Select your timetable" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    {timetables.map((timetable) => (
                      <SelectItem key={timetable.id} value={timetable.id}>
                        {timetable.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {selectedTimetable && (
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{selectedTimetable.name}</h2>
                <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {selectedTimetable.department}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {selectedTimetable.faculty_name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Academic Year: {selectedTimetable.academic_year}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-3 min-w-[1200px]">
                  {/* Header */}
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-gray-900 dark:text-white font-semibold">Time</div>
                  </div>
                  {daysOfWeek.map((day) => (
                    <div key={day} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-gray-900 dark:text-white font-semibold text-center">{day}</div>
                    </div>
                  ))}

                  {/* Time slots */}
                  {timeSlots.map((slot) => (
                    <div key={slot.period} className="contents">
                      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-gray-900 dark:text-white font-semibold">Period {slot.period}</div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{slot.time}</div>
                      </div>
                      {daysOfWeek.map((day) => {
                        const entry = getEntryForCell(day, slot.period)
                        return (
                          <motion.div
                            key={`${day}-${slot.period}`}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              entry
                                ? `${getTypeColor(entry.type)} border-opacity-50 text-white`
                                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 border-dashed"
                            }`}
                            whileHover={{ scale: entry ? 1.02 : 1 }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: slot.period * 0.05 }}
                          >
                            {entry ? (
                              <div className="text-white">
                                <div className="font-semibold text-sm mb-2">{entry.subject}</div>
                                <div className="space-y-1 text-xs opacity-90">
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {entry.room}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {entry.time}
                                  </div>
                                  {entry.semester && entry.section && (
                                    <div className="flex items-center">
                                      <BookOpen className="h-3 w-3 mr-1" />
                                      {entry.semester} - {entry.section}
                                    </div>
                                  )}
                                  <div className="mt-2">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        entry.type === "lab"
                                          ? "bg-purple-800 text-purple-200"
                                          : entry.type === "tutorial"
                                            ? "bg-green-800 text-green-200"
                                            : "bg-blue-800 text-blue-200"
                                      }`}
                                    >
                                      {entry.type.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                                Free Period
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center justify-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Lecture</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 dark:bg-purple-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Lab</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 dark:bg-green-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Tutorial</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {timetables.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Timetables Assigned</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No teaching schedules have been assigned to you yet. Please contact the administration for more
                information.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
interface Class {
  subject: string
  duration: number
  room: string
  type: "lab" | "lecture"
  faculty: string
  time: string
}

interface DaySchedule {
  day: string
  classes: Class[]
}
