import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SignBridge - Real-Time Sign Language Translator",
  description:
    "AI-powered real-time sign language to text translator. Breaking communication barriers for deaf and hard-of-hearing individuals with machine learning gesture recognition.",
  keywords: [
    "sign language translator",
    "ASL translator",
    "ISL translator",
    "gesture recognition",
    "accessibility",
    "deaf communication",
    "machine learning",
    "real-time translation",
  ],
  authors: [{ name: "SignBridge Team" }],
  openGraph: {
    title: "SignBridge - Real-Time Sign Language Translator",
    description: "Breaking communication barriers with AI-powered sign language translation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SignBridge - Real-Time Sign Language Translator",
    description: "Breaking communication barriers with AI-powered sign language translation",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#00ffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
