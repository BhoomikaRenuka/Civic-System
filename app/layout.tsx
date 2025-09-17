import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { SocketProvider } from "@/contexts/socket-context"
import { Toaster } from "@/components/ui/toaster"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "CivicReport - Civic Issue Reporting System",
  description: "Report and track civic issues in your community",
  generator: "v0.app",
  manifest: "/manifest.json",
  keywords: ["civic", "issues", "reporting", "community", "government", "PWA"],
  authors: [{ name: "CivicReport Team" }],
  creator: "CivicReport",
  publisher: "CivicReport",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CivicReport - Civic Issue Reporting System",
    description: "Report and track civic issues in your community",
    url: "http://localhost:3000",
    siteName: "CivicReport",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicReport - Civic Issue Reporting System",
    description: "Report and track civic issues in your community",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CivicReport",
  },
}

// ✅ Move viewport and themeColor OUTSIDE metadata
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const themeColor = [
  { media: "(prefers-color-scheme: light)", color: "#2563eb" },
  { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.jpg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.jpg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.jpg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CivicReport" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster />
              <PWAInstallPrompt />
              <OfflineIndicator />
            </SocketProvider>
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
