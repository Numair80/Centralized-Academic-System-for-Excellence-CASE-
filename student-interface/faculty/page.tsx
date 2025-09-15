"use client"

import { useState } from "react"
import { FacultySearch } from "@/components/student-interface/faculty/faculty-search"
import { FacultyGrid } from "@/components/student-interface/faculty/faculty-grid"

export default function FacultyPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")

  const handleSearch = (query: string, department?: string) => {
    setSearchQuery(query)
    if (department !== undefined) {
      setSelectedDepartment(department)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Faculty Search</h1>
      <FacultySearch onSearch={handleSearch} />
      <FacultyGrid searchQuery={searchQuery} />
    </div>
  )
}
