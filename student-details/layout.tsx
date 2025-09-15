import type React from "react"
import { AvailabilityProvider } from "../contexts/AvailabilityContext"
import { SidebarProvider } from "../contexts/SidebarContext"
import { SettingsProvider } from "../contexts/SettingsContext"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"

export default function StudentDetailsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <AvailabilityProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6">
                {children}
              </main>
            </div>
          </div>
        </AvailabilityProvider>
      </SidebarProvider>
    </SettingsProvider>
  )
}
