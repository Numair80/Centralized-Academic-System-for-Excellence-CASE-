"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParent } from "@/contexts/parent-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const { parent, isLoading } = useParent()
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
  })
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !parent) {
      router.push("/parent-dashboard/settings")
    }
  }, [isLoading, parent, router])

  const handleToggleChange = (name: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [name]: !prev[name] }))

    // Show success notification
    setNotification({
      type: "success",
      message: `${name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} setting updated successfully.`,
    })

    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000)
  }

  if (isLoading) {
    return <SettingsSkeleton />
  }

  if (!parent) {
    return null // Will redirect to login
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
      <p className="text-muted-foreground mb-6">Manage your account settings and preferences</p>

      {notification && (
        <Alert variant={notification.type === "success" ? "default" : "destructive"} className="mb-6 animate-slideIn">
          {notification.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{notification.type === "success" ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your profile information is displayed here. Contact administration to update your information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={parent.name} disabled />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={parent.child_email} disabled />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={parent.contact_number} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Manage how you receive notifications from the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={() => handleToggleChange("emailNotifications")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
              </div>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={() => handleToggleChange("smsNotifications")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display Preferences</CardTitle>
            <CardDescription>Customize how the application appears on your device.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="darkMode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
              </div>
              <Switch
                id="darkMode"
                checked={settings.darkMode}
                onCheckedChange={() => handleToggleChange("darkMode")}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-48 mb-6" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
