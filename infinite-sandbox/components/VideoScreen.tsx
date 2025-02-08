"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { VolumeIcon, VolumeXIcon, PauseIcon, PlayIcon } from "lucide-react"

interface VideoScreenProps {
  onClose: () => void
}

export default function VideoScreen({ onClose }: VideoScreenProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
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
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
        >
          Close
        </Button>
      </div>
    </div>
  )
}

