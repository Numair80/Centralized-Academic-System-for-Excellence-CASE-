"use client"

import { useState, useEffect } from "react"
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  GraduationCapIcon as AcademicCapIcon,
  MapPinIcon,
  BuildingIcon,
} from "lucide-react"
import { motion } from "framer-motion"

interface StaffProfile {
  staff_id: number
  first_name: string
  last_name: string
  email: string
  contact_number: string
  department: string
  block_number: string
  room_number: string
  role: string
  profile_picture: string
}

export default function StaffProfilePage() {
  const [staffDetails, setStaffDetails] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/staff/me", {
      method: "GET",
      credentials: "include", // Required to send JWT in cookies
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setStaffDetails(data.user)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching user data:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-full border-t-4 border-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!staffDetails) {
    return <div className="flex justify-center items-center h-screen text-gray-600 dark:text-white">No staff details found</div>
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Staff Details</h1>
      <motion.div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <motion.img
            src={
              staffDetails.profile_picture
                ? `/upload/${staffDetails.profile_picture}`
                : "/placeholder.svg"
            }
            alt={`${staffDetails.first_name} ${staffDetails.last_name}`}
            className="w-32 h-32 rounded-full object-cover border-4 border-indigo-300"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.9 }}
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">
              {staffDetails.first_name} {staffDetails.last_name}
            </h2>
            <p className="text-indigo-600 dark:text-indigo-400 mb-4">{staffDetails.role}</p>
            <div className="space-y-2">
              <motion.p
                className="flex items-center justify-center sm:justify-start text-gray-700 dark:text-gray-300"
                whileHover={{ x: 5 }}
              >
                <MailIcon className="w-5 h-5 mr-2 text-indigo-500" />
                <a href={`mailto:${staffDetails.email}`} className="hover:underline">
                  {staffDetails.email}
                </a>
              </motion.p>
              <motion.p
                className="flex items-center justify-center sm:justify-start text-gray-700 dark:text-gray-300"
                whileHover={{ x: 5 }}
              >
                <PhoneIcon className="w-5 h-5 mr-2 text-indigo-500" />
                <a href={`tel:${staffDetails.contact_number}`} className="hover:underline">
                  {staffDetails.contact_number}
                </a>
              </motion.p>
              <motion.p
                className="flex items-center justify-center sm:justify-start text-gray-700 dark:text-gray-300"
                whileHover={{ x: 5 }}
              >
                <AcademicCapIcon className="w-5 h-5 mr-2 text-indigo-500" />
                {staffDetails.department}
              </motion.p>
              <motion.p
                className="flex items-center justify-center sm:justify-start text-gray-700 dark:text-gray-300"
                whileHover={{ x: 5 }}
              >
                <BuildingIcon className="w-5 h-5 mr-2 text-indigo-500" />
                Block {staffDetails.block_number}
              </motion.p>
              <motion.p
                className="flex items-center justify-center sm:justify-start text-gray-700 dark:text-gray-300"
                whileHover={{ x: 5 }}
              >
                <MapPinIcon className="w-5 h-5 mr-2 text-indigo-500" />
                Room {staffDetails.room_number}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
