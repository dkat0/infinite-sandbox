"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { VolumeIcon, VolumeXIcon, PauseIcon, PlayIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import QuitConfirmationDialog from "@/components/QuitConfirmationDialog"

export default function StoryPage() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleQuit = () => {
    setShowQuitConfirmation(true)
  }

  const handleConfirmQuit = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A2A3A] via-[#223344] to-[#1A2A3A] flex items-center justify-center">
      <div className="relative w-full max-w-4xl">
        <video
          ref={videoRef}
          src="/placeholder.mp4"
          className="w-full rounded-lg shadow-lg"
          autoPlay
          loop
          muted={isMuted}
        />
        <div className="absolute bottom-4 left-4 flex space-x-2">
          <Button
            onClick={togglePlay}
            variant="secondary"
            size="icon"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
          >
            {isPlaying ? <PauseIcon className="text-white" /> : <PlayIcon className="text-white" />}
          </Button>
          <Button
            onClick={toggleMute}
            variant="secondary"
            size="icon"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
          >
            {isMuted ? <VolumeXIcon className="text-white" /> : <VolumeIcon className="text-white" />}
          </Button>
        </div>
        <Button
          onClick={handleQuit}
          className="absolute top-8 right-8 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
        >
          Quit Story
        </Button>
      </div>
      <QuitConfirmationDialog
        isOpen={showQuitConfirmation}
        onClose={() => setShowQuitConfirmation(false)}
        onConfirm={handleConfirmQuit}
      />
    </div>
  )
}

