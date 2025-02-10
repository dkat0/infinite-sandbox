"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import StoryScreen from "@/components/StoryScreen"
import QuitConfirmationDialog from "@/components/QuitConfirmationDialog"

export default function StoryPage() {
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const theme = searchParams.get("theme")

  const handleQuit = () => {
    setShowQuitConfirmation(true)
  }

  const handleConfirmQuit = () => {
    router.push("/")
  }

  const handleCancelQuit = () => {
    setShowQuitConfirmation(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A2A3A] via-[#223344] to-[#1A2A3A] flex items-center justify-center">
      <StoryScreen 
        onQuit={handleQuit} 
        isQuitConfirmationOpen={showQuitConfirmation}
        theme={theme || undefined}
      />
      <QuitConfirmationDialog 
        isOpen={showQuitConfirmation} 
        onClose={handleCancelQuit} 
        onConfirm={handleConfirmQuit} 
      />
    </div>
  )
}
