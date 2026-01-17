import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { LanguageProvider } from "@/lib/language-context"
import { NotificationProvider } from "@/components/notification-provider"
import { ChatbotWrapper } from "@/components/chatbot-wrapper"
import { Toaster } from "sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DARSHAN.AI - Smart Pilgrimage System",
  description: "Intelligent crowd control and safety management for pilgrimages",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/logo.png" sizes="32x32" />
        <link rel="icon" href="/logo.png" sizes="192x192" />
        <link rel="icon" href="/logo.png" sizes="512x512" />
        <link rel="shortcut icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#93623f" />
      </head>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <LanguageProvider>
            <NotificationProvider>
              {children}
              <ChatbotWrapper />
              <Toaster position="top-right" richColors />
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
