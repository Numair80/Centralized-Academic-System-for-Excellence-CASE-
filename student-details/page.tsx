"use client"

import type React from "react"
import { useState } from "react"
import { SearchIcon, MailIcon, PhoneIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function StudentDetails() {
  const [studentId, setStudentId] = useState("")
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  interface FetchError extends Error {
    message: string
  }

  interface StudentData {
    student_id: string
    first_name: string
    last_name: string
    email: string
    contact_number: string
    department: string
    year: string
    semester: string
    section: string
    semester_marks?: {
      semester: number
      gpa: number
      backlog: number
    }[]
    attendance?: {
      subject: string
      percentage: number
    }[]
  }

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!studentId.trim()) {
      setError("Please enter a student ID")
      return
    }

    setLoading(true)
    setError("")
    setStudentData(null)

    try {
      const response = await fetch(`/api/students/search?studentId=${encodeURIComponent(studentId)}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError("Student not found. Please check the student ID and try again.")
        } else {
          setError("Failed to fetch student data. Please try again.")
        }
        return
      }

      const data: StudentData = await response.json()
      setStudentData(data)
    } catch (error) {
      const fetchError = error as FetchError
      console.error("Error fetching student data:", fetchError.message)
      setError("An error occurred while fetching student data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  const handleContactClick = (contact: string) => {
    // Check if the device is mobile
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = `whatsapp://send?phone=${contact}`
    } else {
      window.location.href = `tel:${contact}`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <motion.h1
        className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-gray-800 dark:text-white"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Student Details
      </motion.h1>

      <motion.form
        onSubmit={handleSearch}
        className="mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row">
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter Student ID (e.g., 160421737049)"
            className="flex-grow px-4 py-2 mb-2 sm:mb-0 sm:mr-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <motion.button
            type="submit"
            disabled={loading}
            className="bg-indigo-500 text-white dark:text-gray-200 px-4 py-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            <SearchIcon className="h-5 w-5 sm:mr-2 inline-block" />
            <span className="hidden sm:inline">{loading ? "Searching..." : "Search"}</span>
          </motion.button>
        </div>
      </motion.form>

      <AnimatePresence>
        {loading && (
          <motion.div
            className="flex justify-center items-center my-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full border-t-4 border-indigo-500 rounded-full animate-spin"></div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </motion.div>
        )}

        {studentData && (
          <motion.div
            className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
              {studentData.first_name} {studentData.last_name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <motion.p
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <strong>Student ID:</strong> {studentData.student_id}
              </motion.p>
              <motion.p
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <strong>Department:</strong> {studentData.department}
              </motion.p>
              <motion.p
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <strong>Year:</strong> {studentData.year}
              </motion.p>
              <motion.p
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <strong>Semester:</strong> {studentData.semester}
              </motion.p>
              <motion.p
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <strong>Section:</strong> {studentData.section}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <motion.p
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => handleEmailClick(studentData.email)}
              >
                <strong>Email:</strong>{" "}
                <span className="text-blue-500 hover:underline">
                  <MailIcon className="inline-block w-4 h-4 mr-1" />
                  {studentData.email}
                </span>
              </motion.p>
              <motion.p
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={() => handleContactClick(studentData.contact_number)}
              >
                <strong>Contact:</strong>{" "}
                <span className="text-blue-500 hover:underline">
                  <PhoneIcon className="inline-block w-4 h-4 mr-1" />
                  {studentData.contact_number}
                </span>
              </motion.p>
            </div>

            {studentData.semester_marks && studentData.semester_marks.length > 0 && (
              <>
                <h3 className="text-md sm:text-lg lg:text-xl font-semibold mt-6 mb-4 text-gray-800 dark:text-white">
                  Semester Marks
                </h3>
                <div className="overflow-x-auto">
                  <motion.table
                    className="w-full mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="p-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300">Semester</th>
                        <th className="p-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300">GPA</th>
                        <th className="p-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300">Backlog</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.semester_marks.map((sem, index) => (
                        <motion.tr
                          key={sem.semester}
                          className="border-b dark:border-gray-600"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <td className="p-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">{sem.semester}</td>
                          <td className="p-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">{sem.gpa}</td>
                          <td className="p-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">{sem.backlog}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </motion.table>
                </div>
              </>
            )}

            {studentData.attendance && studentData.attendance.length > 0 && (
              <>
                <h3 className="text-md sm:text-lg lg:text-xl font-semibold mt-6 mb-4 text-gray-800 dark:text-white">
                  Attendance
                </h3>
                <div className="overflow-x-auto">
                  <motion.table
                    className="w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="p-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300">Subject</th>
                        <th className="p-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          Attendance Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.attendance.map((subject, index) => (
                        <motion.tr
                          key={subject.subject}
                          className="border-b dark:border-gray-600"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <td className="p-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">{subject.subject}</td>
                          <td className="p-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <motion.div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${subject.percentage}%` }}
                                transition={{ duration: 0.5, delay: 0.2 * index }}
                              ></motion.div>
                            </div>
                            <span className="ml-2">{subject.percentage}%</span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </motion.table>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
