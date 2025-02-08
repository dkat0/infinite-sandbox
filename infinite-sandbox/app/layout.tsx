import "./globals.css"
import { Orbitron } from "next/font/google"
import type React from "react"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
})

export const metadata = {
  title: "Infinite Sandbox",
  description: "An interactive storytelling experience",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} font-sans`}>{children}</body>
    </html>
  )
}