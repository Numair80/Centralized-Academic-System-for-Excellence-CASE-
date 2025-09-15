import type React from "react"
import "../globals.css"
import { Inter } from "next/font/google"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"
import { AvailabilityProvider } from "../contexts/AvailabilityContext"
import { SettingsProvider } from "../contexts/SettingsContext"
import { SidebarProvider } from "../contexts/SidebarContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Staff Portal",
  description: "Interactive staff portal for college/institution",
}

export default function StaffPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${inter.className} min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-indigo-900`}
    >
      <SettingsProvider>
        <AvailabilityProvider>
          <SidebarProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </AvailabilityProvider>
      </SettingsProvider>
    </div>
  )
}
