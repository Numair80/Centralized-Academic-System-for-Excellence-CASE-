"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UserCheck, Mail, Phone, MapPin, Briefcase, Users, Calendar, AlertCircle, ArrowLeft, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/parent-interface/sidebar"
import { Header } from "@/components/parent-interface/header"

interface ParentData {
  id: string
  parent_id?: string
  username?: string
  first_name: string
  last_name: string
  name: string
  email: string
  contact_number: string
  address?: string
  occupation?: string
  relationship: string
  child_email?: string
  role: string
  type: string
  created_at?: string
  updated_at?: string
}

export default function ParentAccount() {
  const [parent, setParent] = useState<ParentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadParentData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        try {
          const response = await fetch("/api/auth/parent/me", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.user) {
              setParent(data.user)
            } else {
              handleFallbackToLocalStorage()
            }
          } else {
            if (response.status === 401) {
              router.push("/login")
              return
            }
            handleFallbackToLocalStorage()
          }
        } catch (apiError) {
          console.error("API call failed:", apiError)
          handleFallbackToLocalStorage()
        }
      } catch (error) {
        console.error("Error in loadParentData:", error)
        setError("Failed to load parent data. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    const handleFallbackToLocalStorage = () => {
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          if (userData.role === "parent" || userData.type === "parent") {
            setParent(userData)
          } else {
            setError("Access denied. Parent credentials required.")
          }
        } else {
          setError("No user data found. Please login again.")
        }
      } catch (storageError) {
        console.error("Error reading from localStorage:", storageError)
        setError("Failed to load user data. Please login again.")
      }
    }

    loadParentData()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar
          open={true}
          onToggle={() => {}}
          onClose={() => {}}
          isMobile={false}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onToggleSidebar={() => {}} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading parent account details...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error || !parent) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar
          open={true}
          onToggle={() => {}}
          onClose={() => {}}
          isMobile={false}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onToggleSidebar={() => {}} />
          <main className="flex-1 overflow-y-auto p-6">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Error Loading Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{error || "Failed to load parent account details."}</p>
                <div className="flex gap-2">
                  <Button onClick={() => window.location.reload()} className="flex-1">
                    Retry
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/parent-dashboard")} className="flex-1">
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        open={true}
        onToggle={() => {}}
        onClose={() => {}}
        isMobile={false}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => {}} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Back button */}
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push("/parent-dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>

            {/* Page Title */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Parent Account Details</h1>
              <Badge variant="outline">Parent Profile</Badge>
            </div>

            {/* Profile Card */}
            <Card className="overflow-hidden">
              {/* Header with background */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32 relative">
                <div className="absolute bottom-0 left-0 right-0 px-6 py-4 flex justify-between items-end">
                  <div className="flex items-end gap-4">
                    <Avatar className="h-24 w-24 border-4 border-white">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                        {parent.first_name?.[0]}
                        {parent.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mb-2 text-white">
                      <h2 className="text-2xl font-bold">{parent.name}</h2>
                      <p className="opacity-90">{parent.relationship}</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="mb-2">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>

              <CardContent className="pt-6 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">{parent.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p className="font-medium">{parent.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium">{parent.contact_number || "Not provided"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{parent.address || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Additional Information</h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Occupation</p>
                          <p className="font-medium">{parent.occupation || "Not provided"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Relationship to Child</p>
                          <p className="font-medium">{parent.relationship || "Not specified"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Child's Email</p>
                          <p className="font-medium">{parent.child_email || "Not linked"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Account Created</p>
                          <p className="font-medium">
                            {parent.created_at ? new Date(parent.created_at).toLocaleDateString() : "Not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <Separator />

              <CardFooter className="flex justify-between py-4">
                <div className="text-sm text-gray-500">
                  Last updated: {parent.updated_at ? new Date(parent.updated_at).toLocaleDateString() : "Not available"}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                  <Button size="sm">Update Profile</Button>
                </div>
              </CardFooter>
            </Card>

            {/* Account Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive email updates about your child's performance</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Privacy Settings</p>
                    <p className="text-sm text-gray-500">Manage your data and privacy preferences</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Security</p>
                    <p className="text-sm text-gray-500">Update password and security settings</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
