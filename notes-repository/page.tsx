"use client"

import { useState, useEffect } from "react"
import { NotesRepository } from "@/components/notes-repository"
import { Header } from "@/components/header"
import { LoginModal } from "@/components/login-modal"
import { useTheme } from "next-themes"

export default function NotesRepositoryPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { theme, setTheme } = useTheme()

  // Check for saved user on page load
  useEffect(() => {
    const checkSavedUser = () => {
      try {
        // Check localStorage first (Remember me = true)
        let savedUser = localStorage.getItem("notesRepoUser")

        // If not found, check sessionStorage (Remember me = false)
        if (!savedUser) {
          savedUser = sessionStorage.getItem("notesRepoUser")
        }

        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setCurrentUser(userData)
          console.log("User restored from storage:", userData)
        }
      } catch (error) {
        console.error("Error loading saved user:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSavedUser()
  }, [])

  const handleNotesUploaded = () => {
    console.log("Notes uploaded successfully!")
  }

  const handleNotesRequested = () => {
    console.log("Note request submitted successfully!")
  }

  const handleLogin = (userData: any) => {
    setCurrentUser(userData)
    setShowLoginModal(false)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    // Clear both localStorage and sessionStorage
    localStorage.removeItem("notesRepoUser")
    sessionStorage.removeItem("notesRepoUser")
    localStorage.removeItem("savedCredentials")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        theme={theme}
        setTheme={setTheme}
        user={currentUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      <NotesRepository
        currentUser={currentUser}
        handleNotesUploaded={handleNotesUploaded}
        handleNotesRequested={handleNotesRequested}
        searchQuery={searchQuery}
        viewMode={viewMode}
      />

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} onLogin={handleLogin} />
    </div>
  )
}
