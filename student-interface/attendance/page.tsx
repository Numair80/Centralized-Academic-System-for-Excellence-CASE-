import type { Metadata } from "next"
import { AttendanceOverview } from "@/components/student-interface/attendance/attendance-overview"

export const metadata: Metadata = {
  title: "Attendance | C.A.S.E",
  description: "View and manage your attendance records",
}

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>
      <AttendanceOverview />
    </div>
  )
}
