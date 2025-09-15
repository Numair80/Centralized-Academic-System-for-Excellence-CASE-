"use client"

import type React from "react"
import { useState, useEffect, useContext } from "react"
import { ParentProvider, ParentContext } from "@/contexts/parent-context"
import { ThemeProvider } from "@/providers/theme-provider"
import { Sidebar } from "@/components/parent-interface/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, Bell, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const context = useContext(ParentContext)
const parent = context?.parent


  const handleToggle = () => setCollapsed(!collapsed)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const getInitials = () => {
    const first = parent?.first_name?.[0] || ""
    const last = parent?.last_name?.[0] || ""
    return `${first}${last}`.toUpperCase()
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ParentProvider>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-4">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4">
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold">C.A.S.E Parent Portal</h1>
              </div>

              <div className="ml-auto flex items-center space-x-2">
                <ThemeToggle />

                <Button variant="ghost" size="icon" asChild>
                  <Link href="/parent-dashboard/notifications">
                    <Bell className="h-5 w-5" />
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatar.png" alt={`${parent?.first_name} ${parent?.last_name}`} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {parent ? `${parent.first_name} ${parent.last_name}` : "Parent Name"}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/parent-dashboard/settings">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="flex">
            {/* Sidebar */}
            <Sidebar
              collapsed={collapsed}
              onToggle={handleToggle}
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              isMobile={isMobile}
            />

            {/* Main Content */}
            <main
              className={cn(
                "flex-1 transition-all duration-300 ease-in-out min-h-[calc(100vh-4rem)]",
                sidebarOpen && !isMobile ? "ml-64" : "ml-0",
              )}
            >
              <div className="p-6">{children}</div>
            </main>
          </div>

          {/* Mobile Overlay */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              style={{ top: "4rem" }}
            />
          )}
        </div>
      </ParentProvider>
    </ThemeProvider>
  )
}
