import type { Metadata } from "next"
import { AssignmentList } from "@/components/student-interface/assignments/assignment-list"

export const metadata: Metadata = {
  title: "Assignments | C.A.S.E",
  description: "View and manage your assignments",
}

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Assignments</h1>
      <AssignmentList />
    </div>
  )
}
