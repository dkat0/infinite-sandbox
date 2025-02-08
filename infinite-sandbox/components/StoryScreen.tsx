"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { VolumeIcon, VolumeXIcon, PauseIcon, PlayIcon } from "lucide-react"

interface StoryScreenProps {
  videoSrc: string
  options: string[]
  onOptionSelect: (option: string) => void
  onQuit: () => void
}

export default function StoryScreen({ videoSrc, options, onOptionSelect, onQuit }: StoryScreenProps) {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="relative w-full max-w-4xl rounded-lg overflow-hidden">
        <video ref={videoRef} src={videoSrc} className="w-full rounded-lg shadow-lg" autoPlay loop muted={isMuted} />
        <div className="absolute bottom-4 left-4 flex space-x-2">
          <Button
            onClick={togglePlay}
            variant="secondary"
            size="icon"
            className="bg-white/70 hover:bg-white/90 backdrop-blur-sm"
          >
            {isPlaying ? (
              <PauseIcon className="text-slate-600 w-4 h-4" />
            ) : (
              <PlayIcon className="text-slate-600 w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={toggleMute}
            variant="secondary"
            size="icon"
            className="bg-white/70 hover:bg-white/90 backdrop-blur-sm"
          >
            {isMuted ? (
              <VolumeXIcon className="text-slate-600 w-4 h-4" />
            ) : (
              <VolumeIcon className="text-slate-600 w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 max-w-2xl w-full px-4">
        {options.map((option, index) => (
          <Button
            key={index}
            onClick={() => onOptionSelect(option)}
            className="bg-white/80 hover:bg-white/90 text-slate-600 font-light py-6 px-6 
              rounded-full transition duration-300 ease-out hover:shadow-lg backdrop-blur-sm
              border border-slate-200 tracking-wide"
          >
            {option}
          </Button>
        ))}
      </div>
      <Button
        onClick={onQuit}
        className="mt-8 bg-slate-100/80 hover:bg-slate-200/90 text-slate-500 font-light 
          py-2 px-6 rounded-full transition duration-300 ease-out tracking-wide"
      >
        Quit
      </Button>
    </div>
  )
}

