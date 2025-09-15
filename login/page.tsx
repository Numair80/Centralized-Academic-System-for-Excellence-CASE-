"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  GraduationCap,
  Lock,
  User,
  UserCheck,
  UserCog,
  Users,
  Eye, EyeOff
} from "lucide-react"
import { motion } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState("student")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError("")

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifier, password, role: selectedRole }),
    })

    // SAFEGUARD: Check if response has content
    const isJson = res.headers.get("content-type")?.includes("application/json")
    const data = isJson ? await res.json() : {}

    if (!res.ok) {
      throw new Error(data.error || "Login failed")
    }

    if (data.redirectTo) {
      router.push(data.redirectTo)
    } else {
      throw new Error("Redirection path not provided")
    }
  } catch (err: any) {
    setError(err.message || "Login failed. Please try again later.")
  } finally {
    setIsLoading(false)
  }
}



  const getDefaultRedirect = (role: string) => {
    switch (role) {
      case "student":
        return "/student-interface"
      case "staff":
        return "/staff-portal"
      case "parent":
        return "/parent-dashboard"
      case "admin":
        return "/dashboard"
      default:
        return "/"
    }
  }

  const roleIcons = {
    student: <User className="h-5 w-5" />,
    staff: <UserCheck className="h-5 w-5" />,
    parent: <Users className="h-5 w-5" />,
    admin: <UserCog className="h-5 w-5" />,
  }

  return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <header className="border-b py-3 bg-white dark:bg-gray-950 shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <Link href="/case-homepage" className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-indigo-600" />
                <span className="text-xl font-bold">C.A.S.E</span>
              </Link>
            </motion.div>
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <Link
                href="/case-homepage"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </motion.div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Card className="w-full max-w-md border shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-indigo-600">Login to C.A.S.E</CardTitle>
                <CardDescription className="text-center">Access your role-specific portal</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label>Select Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="identifier">{selectedRole === "student" ? "Email" : "Username"}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="identifier"
                        type={selectedRole === "student" ? "email" : "text"}
                        placeholder={selectedRole === "student" ? "student@email.com" : `${selectedRole}123`}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

                  {error && (
                    <div className="text-sm text-red-500 bg-red-100 rounded-md px-3 py-2">{error}</div>
                  )}

                  <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {isLoading ? "Logging in..." : `Login as ${selectedRole}`}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center text-sm">
                Don’t have an account?{" "}
                <Link href="#" className="text-indigo-600 ml-1 hover:underline">
                  Contact Admin
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </main>

        <footer className="border-t py-3 bg-white dark:bg-gray-950 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} C.A.S.E - Centralized Academic System for Excellence
        </footer>
    </div>
  )
}
