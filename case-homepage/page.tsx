"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, ArrowRight, Sparkles, Menu, ChevronLeft, MessageSquare, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import HeroSection from "@/components/case/hero-section"
import FeaturesSection from "@/components/case/features-section"
import StatsSection from "@/components/case/stats-section"
import TestimonialsSection from "@/components/case/testimonials-section"
import { CaseLogo } from "@/components/case-logo"
import { EventsTicker } from "@/components/events-ticker"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { FeedbackForm } from "@/components/feedback-form"

export default function CaseHomepage() {
  const [activeTab, setActiveTab] = useState("all")
  const [activeSection, setActiveSection] = useState("")
  const [scrollY, setScrollY] = useState(0)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [recentNotes, setRecentNotes] = useState<any[]>([])
  const [popularNotes, setPopularNotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventsVisible, setEventsVisible] = useState(false)

  // Handle scroll for header effects and section highlighting
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)

      // Determine active section based on scroll position with better detection
      const sections = ["features", "testimonials"]
      let foundActiveSection = ""

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top + window.scrollY
          const elementBottom = elementTop + rect.height
          const scrollPosition = window.scrollY + 300 // Offset for better detection

          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            foundActiveSection = section
            break
          }
        }
      }

      setActiveSection(foundActiveSection)
    }

    window.addEventListener("scroll", handleScroll)
    // Call once to set initial state
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Add a delay before showing the events section
  useEffect(() => {
    const timer = setTimeout(() => {
      setEventsVisible(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Fetch recent and popular notes
  useEffect(() => {
    async function fetchNotes() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/notes")

        if (response.ok) {
          const data = await response.json()

          // Ensure data is an array
          const notesArray = Array.isArray(data) ? data : data?.notes && Array.isArray(data.notes) ? data.notes : []

          if (notesArray.length > 0) {
            // Sort by upload date for recent notes
            const sortedByDate = [...notesArray]
              .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
              .slice(0, 4)

            // Sort by downloads/upvotes for popular notes
            const sortedByPopularity = [...notesArray]
              .sort((a, b) => (b.downloads || 0) + (b.upvotes || 0) - ((a.downloads || 0) + (a.upvotes || 0)))
              .slice(0, 4)

            setRecentNotes(sortedByDate)
            setPopularNotes(sortedByPopularity)
          } else {
            // Set empty arrays if no notes
            setRecentNotes([])
            setPopularNotes([])
          }
        } else {
          console.error("Failed to fetch notes:", response.status, response.statusText)
          setRecentNotes([])
          setPopularNotes([])
        }
      } catch (error) {
        console.error("Error fetching notes:", error)
        setRecentNotes([])
        setPopularNotes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [])

  // Improved scroll to section function
  const scrollToSection = (sectionId: string) => {
    console.log(`Scrolling to section: ${sectionId}`) // Debug log
    const section = document.getElementById(sectionId)
    if (section) {
      const headerHeight = 80 // Account for sticky header
      const elementPosition = section.offsetTop - headerHeight

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      })

      // Update active section immediately for better UX
      setActiveSection(sectionId)
    } else {
      console.warn(`Section with id "${sectionId}" not found`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with professional design */}
      <header
        className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{
          boxShadow: scrollY > 50 ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none",
          transition: "box-shadow 0.3s ease",
        }}
      >
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/case-homepage">
              <CaseLogo size="md" withText animated />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { name: "Features", id: "features" },
              { name: "Testimonials", id: "testimonials" },
              { name: "Notes Repository", href: "/notes-repository" },
            ].map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-sm font-medium relative group hover:text-indigo-600 transition-colors"
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full" />
                  </Link>
                ) : (
                  <button
                    onClick={() => scrollToSection(item.id!)}
                    className={`text-sm font-medium relative group transition-colors hover:text-indigo-600 ${
                      activeSection === item.id ? "text-indigo-600" : ""
                    }`}
                  >
                    {item.name}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 transition-all duration-300 ${
                        activeSection === item.id ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </button>
                )}
              </motion.div>
            ))}
          </nav>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ThemeToggle />

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Button variant="outline" size="icon" className="mr-2" onClick={() => setFeedbackModalOpen(true)}>
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <span className="sr-only">Feedback</span>
              </Button>
            </motion.div>

            {/* Mobile menu using Sheet component */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon" aria-label="Menu" className="h-10 w-10 border-indigo-100">
                  <Menu className="h-5 w-5 text-indigo-600" />
                  <span className="sr-only">Open main menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[385px] p-0">
                <div className="grid gap-0 h-full">
                  <div className="flex items-center justify-between px-4 h-16 border-b">
                    <Link href="/case-homepage" className="flex items-center gap-2">
                      <CaseLogo size="sm" withText />
                    </Link>
                  </div>
                  <nav className="overflow-y-auto">
                    <div className="flex flex-col gap-1 p-4">
                      {[
                        { name: "Features", id: "features" },
                        { name: "Testimonials", id: "testimonials" },
                        { name: "Notes Repository", href: "/notes-repository" },
                      ].map((item) => (
                        <div key={item.name}>
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <button
                              onClick={() => {
                                scrollToSection(item.id!)
                                // Close the sheet after clicking (you might need to add sheet close logic)
                              }}
                              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md hover:bg-muted text-left w-full transition-colors ${
                                activeSection === item.id ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : ""
                              }`}
                            >
                              {item.name}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </nav>
                  <div className="mt-auto p-4 border-t">
                    <Link href="/login" className="w-full">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Login</Button>
                    </Link>
                    <Link
                      href="/case-homepage"
                      className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back to Home
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="hidden md:block"
            >
              <Link href="/login">
                <Button className="relative overflow-hidden group bg-indigo-600 hover:bg-indigo-700">
                  <span className="relative z-10">Login</span>
                  <span className="absolute inset-0 bg-white dark:bg-indigo-400 opacity-0 group-hover:opacity-20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 py-6 md:py-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            <div className="lg:col-span-2">
              <HeroSection />
            </div>
            <div className="lg:col-span-1">
              <AnimatePresence>
                {eventsVisible && (
                  <motion.div
                    className="rounded-xl border-2 border-indigo-100 dark:border-indigo-800/30 overflow-hidden shadow-md bg-white dark:bg-gray-900 transition-all duration-300 hover:shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 20,
                      delay: 0.5,
                    }}
                  >
                    <motion.div
                      className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 px-4 py-3 transition-colors duration-300"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.7,
                        duration: 0.5,
                      }}
                    >
                      <motion.h2
                        className="text-lg md:text-xl font-semibold text-white flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                      >
                        <Calendar className="h-5 w-5" />
                        Event Announcements
                      </motion.h2>
                      <motion.p
                        className="text-xs text-indigo-100 dark:text-indigo-200 mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                      >
                        Stay updated with the latest campus activities and important dates
                      </motion.p>
                    </motion.div>
                    <div className="p-1 bg-white dark:bg-gray-900 transition-colors duration-300">
                      <EventsTicker />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features">
          <FeaturesSection />
        </div>

        <StatsSection />

        {/* Testimonials Section */}
        <div id="testimonials">
          <TestimonialsSection onFeedbackClick={() => setFeedbackModalOpen(true)} />
        </div>

        {/* Notes Repository Section with enhanced design */}
        <section className="py-8 md:py-16 relative overflow-hidden bg-white dark:bg-gray-900">
          {/* Animated elements */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-indigo-100/50 dark:bg-indigo-900/20"
              style={{
                width: `${Math.random() * 30 + 10}px`,
                height: `${Math.random() * 30 + 10}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                zIndex: 0,
              }}
              animate={{
                y: [0, -50, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 10 + 15,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
            />
          ))}

          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 relative z-10 w-full">
            <motion.div
              className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.div
                className="w-full md:w-1/2 space-y-4"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Sparkles className="h-4 w-4" />
                  Knowledge Sharing
                </motion.div>
                <motion.h2
                  className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-indigo-600 dark:text-indigo-400"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  Notes Repository
                </motion.h2>
                <motion.p
                  className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                >
                  Access a comprehensive collection of academic notes, study materials, and resources organized by
                  branch, semester, and subject.
                </motion.p>
                <motion.div
                  className="flex flex-col sm:flex-row gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Link href="/notes-repository">
                      <Button className="gap-1 bg-indigo-600 hover:bg-indigo-700 relative overflow-hidden group">
                        <span className="relative z-10">Browse Repository</span>
                        <motion.div
                          className="relative z-10"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                        <span className="absolute inset-0 bg-white dark:bg-indigo-400 opacity-0 group-hover:opacity-20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Link href="/login">
                      <Button
                        variant="outline"
                        className="border-indigo-200 hover:border-indigo-300 dark:border-indigo-700 dark:hover:border-indigo-600 transition-colors"
                      >
                        Upload Notes
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>

              <motion.div
                className="w-full md:w-1/2 mt-6 md:mt-0"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <motion.div
                  whileHover={{
                    y: -10,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Card className="overflow-hidden border-2 shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-800">
                    <CardContent className="p-0">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="border-b px-4 bg-gray-50 dark:bg-gray-800">
                          <TabsList className="bg-transparent h-12">
                            <TabsTrigger
                              value="all"
                              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                            >
                              All Notes
                            </TabsTrigger>
                            <TabsTrigger
                              value="popular"
                              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                            >
                              Popular
                            </TabsTrigger>
                            <TabsTrigger
                              value="recent"
                              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                            >
                              Recent
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <TabsContent value="all" className="m-0">
                              <div className="grid gap-2 p-4">
                                {isLoading ? (
                                  Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-3 rounded-lg border p-3 animate-pulse"
                                    >
                                      <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                      <div className="flex-1 space-y-1">
                                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                      </div>
                                    </div>
                                  ))
                                ) : recentNotes.length > 0 ? (
                                  recentNotes.map((note, i) => (
                                    <motion.div
                                      key={note.id || i}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3, delay: i * 0.1 }}
                                      whileHover={{
                                        scale: 1.02,
                                        backgroundColor: "rgba(79, 70, 229, 0.05)",
                                        transition: { type: "spring", stiffness: 400, damping: 10 },
                                      }}
                                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors border-gray-200 dark:border-gray-800"
                                    >
                                      <motion.div
                                        animate={{ rotate: [0, 10, 0] }}
                                        transition={{
                                          duration: 2,
                                          repeat: Number.POSITIVE_INFINITY,
                                          repeatType: "reverse",
                                          delay: i * 0.5,
                                        }}
                                      >
                                        <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                      </motion.div>
                                      <div className="flex-1 space-y-1">
                                        <p className="font-medium leading-none">{note.title || "Untitled Note"}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {note.subject || "Unknown Subject"} • Semester {note.semester || "N/A"}
                                        </p>
                                      </div>
                                      <motion.div
                                        whileHover={{ scale: 1.2, rotate: 15 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                                        >
                                          <ArrowRight className="h-4 w-4" />
                                        </Button>
                                      </motion.div>
                                    </motion.div>
                                  ))
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    No notes available. Be the first to upload!
                                  </div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="popular" className="m-0">
                              <div className="grid gap-2 p-4">
                                {isLoading ? (
                                  Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-3 rounded-lg border p-3 animate-pulse"
                                    >
                                      <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                      <div className="flex-1 space-y-1">
                                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                      </div>
                                    </div>
                                  ))
                                ) : popularNotes.length > 0 ? (
                                  popularNotes.map((note, i) => (
                                    <motion.div
                                      key={note.id || i}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3, delay: i * 0.1 }}
                                      whileHover={{
                                        scale: 1.02,
                                        backgroundColor: "rgba(79, 70, 229, 0.05)",
                                        transition: { type: "spring", stiffness: 400, damping: 10 },
                                      }}
                                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors border-gray-200 dark:border-gray-800"
                                    >
                                      <motion.div
                                        animate={{ rotate: [0, 10, 0] }}
                                        transition={{
                                          duration: 2,
                                          repeat: Number.POSITIVE_INFINITY,
                                          repeatType: "reverse",
                                          delay: i * 0.5,
                                        }}
                                      >
                                        <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                      </motion.div>
                                      <div className="flex-1 space-y-1">
                                        <p className="font-medium leading-none">{note.title || "Untitled Note"}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {note.subject || "Unknown Subject"} • Semester {note.semester || "N/A"}
                                        </p>
                                      </div>
                                      <motion.div
                                        whileHover={{ scale: 1.2, rotate: 15 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                                        >
                                          <ArrowRight className="h-4 w-4" />
                                        </Button>
                                      </motion.div>
                                    </motion.div>
                                  ))
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    No popular notes yet. Start uploading and sharing!
                                  </div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="recent" className="m-0">
                              <div className="grid gap-2 p-4">
                                {isLoading ? (
                                  Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-3 rounded-lg border p-3 animate-pulse"
                                    >
                                      <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                      <div className="flex-1 space-y-1">
                                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                      </div>
                                    </div>
                                  ))
                                ) : recentNotes.length > 0 ? (
                                  recentNotes.map((note, i) => (
                                    <motion.div
                                      key={note.id || i}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3, delay: i * 0.1 }}
                                      whileHover={{
                                        scale: 1.02,
                                        backgroundColor: "rgba(79, 70, 229, 0.05)",
                                        transition: { type: "spring", stiffness: 400, damping: 10 },
                                      }}
                                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors border-gray-200 dark:border-gray-800"
                                    >
                                      <motion.div
                                        animate={{ rotate: [0, 10, 0] }}
                                        transition={{
                                          duration: 2,
                                          repeat: Number.POSITIVE_INFINITY,
                                          repeatType: "reverse",
                                          delay: i * 0.5,
                                        }}
                                      >
                                        <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                      </motion.div>
                                      <div className="flex-1 space-y-1">
                                        <p className="font-medium leading-none">{note.title || "Untitled Note"}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {note.subject || "Unknown Subject"} • Semester {note.semester || "N/A"}
                                        </p>
                                      </div>
                                      <motion.div
                                        whileHover={{ scale: 1.2, rotate: 15 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                                        >
                                          <ArrowRight className="h-4 w-4" />
                                        </Button>
                                      </motion.div>
                                    </motion.div>
                                  ))
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    No recent notes available. Upload some notes!
                                  </div>
                                )}
                              </div>
                            </TabsContent>
                          </motion.div>
                        </AnimatePresence>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer with professional design */}
      <footer className="border-t py-6 md:py-8 bg-white dark:bg-gray-950">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-between gap-4 md:flex-row w-full">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <CaseLogo size="sm" withText={false} />
            <p className="text-sm font-medium">
              © {new Date().getFullYear()} C.A.S.E - Centralized Academic System for Excellence
            </p>
          </motion.div>
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {["Privacy Policy", "Terms of Service", "Contact"].map((item, i) => (
              <Link
                key={item}
                href="#"
                className="text-sm text-muted-foreground hover:text-indigo-600 transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </motion.div>
        </div>
      </footer>
      <FeedbackForm open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen} />
    </div>
  )
}
