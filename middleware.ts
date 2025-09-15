import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes
const protectedRoutes = [
  "/dashboard",
  "/student-interface",
  "/staff-portal",
  "/parent-dashboard",
  "/api/admin",
  "/api/staff",
  "/api/students",
  "/api/parents",
]

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/case-homepage",
  "/login",
  "/notes-repository",
  "/api/auth",
  "/api/register"
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  )
  if (isPublicRoute) return NextResponse.next()

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  if (!isProtectedRoute) return NextResponse.next()

  // Check all valid session cookies
  const staffToken = request.cookies.get("staff_session")?.value
  const studentToken = request.cookies.get("student_session")?.value
  const parentToken = request.cookies.get("parent_session")?.value

  const isLoggedIn = !!(staffToken || studentToken || parentToken)

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Assume token is valid for now; verify it later inside API or route components
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
