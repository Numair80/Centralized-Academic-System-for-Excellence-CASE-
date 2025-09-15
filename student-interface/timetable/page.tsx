"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, RefreshCw } from "lucide-react"

interface TimetableEntry {
  id?: string
  day: string
  time: string
  subject: string
  room: string
  faculty: string
  type?: "lecture" | "lab" | "practical"
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function EnhancedTimetable() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<string>("Monday")

  const fetchTimetable = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/timetable", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTimetable(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Error fetching timetable:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTimetable()

    // Set up real-time polling for admin updates
    const interval = setInterval(fetchTimetable, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const getSubjectType = (subject: string): "lecture" | "lab" | "practical" => {
    const subjectLower = subject.toLowerCase()
    if (subjectLower.includes("lab") || subjectLower.includes("practical")) {
      return "lab"
    }
    if (subjectLower.includes("project") || subjectLower.includes("workshop")) {
      return "practical"
    }
    return "lecture"
  }

  const getTypeColor = (type: "lecture" | "lab" | "practical") => {
    switch (type) {
      case "lecture":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "lab":
        return "bg-green-100 text-green-800 border-green-200"
      case "practical":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredTimetable = timetable.filter((entry) => entry.day === selectedDay)

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Class Timetable
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTimetable}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Day Selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          {daysOfWeek.map((day) => (
            <Button
              key={day}
              variant={selectedDay === day ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(day)}
              className={`transition-all duration-200 ${
                selectedDay === day
                  ? "bg-primary text-primary-foreground shadow-md transform scale-105"
                  : "hover:bg-secondary hover:scale-105"
              }`}
            >
              {day}
            </Button>
          ))}
        </div>

        {/* Timetable Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">Loading timetable...</p>
            </div>
          </div>
        ) : filteredTimetable.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No classes scheduled</h3>
            <p className="text-sm text-muted-foreground">Enjoy your free day!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTimetable
              .sort((a, b) => {
                const timeA = new Date(`1970/01/01 ${a.time}`).getTime()
                const timeB = new Date(`1970/01/01 ${b.time}`).getTime()
                return timeA - timeB
              })
              .map((entry, index) => {
                const type = getSubjectType(entry.subject)
                return (
                  <div
                    key={`${entry.day}-${entry.time}-${index}`}
                    className="group relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={`${getTypeColor(type)} font-medium`}>{type.toUpperCase()}</Badge>
                          <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
                            {entry.subject}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">{entry.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{entry.room}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span>{entry.faculty}</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="h-12 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                      </div>
                    </div>

                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Real-time sync indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time sync with admin updates</span>
        </div>
      </CardContent>
    </Card>
  )
}
export default EnhancedTimetable
