"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import StoryScreen from "@/components/StoryScreen"
import QuitConfirmationDialog from "@/components/QuitConfirmationDialog"

export default function StoryPage() {
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [storyId, setStoryId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initializeStory = async () => {
      try {
        const response = await fetch("/api/initialize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_theme: "A mysterious adventure" }), // You might want to get this from user input
        })
        const data = await response.json()
        setStoryId(data.story_id)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to initialize story:", error)
        setIsLoading(false)
      }
    }

    initializeStory()
  }, [])

  const handleQuit = () => {
    setShowQuitConfirmation(true)
  }

  const handleConfirmQuit = () => {
    router.push("/")
  }

  const handleCancelQuit = () => {
    setShowQuitConfirmation(false)
  }

  if (isLoading || !storyId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white text-2xl">
        Loading your journey...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A2A3A] via-[#223344] to-[#1A2A3A] flex items-center justify-center">
      <StoryScreen onQuit={handleQuit} isQuitConfirmationOpen={showQuitConfirmation} storyId={storyId} />
      <QuitConfirmationDialog isOpen={showQuitConfirmation} onClose={handleCancelQuit} onConfirm={handleConfirmQuit} />
    </div>
  )
}

