import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { UserSettingsProvider } from "@/contexts/user-settings-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "C.A.S.E.",
  description: "Centralized Academic System for Excellence",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <UserSettingsProvider>
              {children}
              <Toaster />
            </UserSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
