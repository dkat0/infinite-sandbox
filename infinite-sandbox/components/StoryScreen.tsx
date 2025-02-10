"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { VolumeIcon, VolumeXIcon, XIcon } from "lucide-react"
import ReactPlayer from "react-player"
import { useStory } from "@/hooks/useStory"
import LoadingScreen from "./LoadingScreen"

interface StoryScreenProps {
  onQuit: () => void
  isQuitConfirmationOpen: boolean
  theme?: string
}

export default function StoryScreen({ onQuit, isQuitConfirmationOpen, theme }: StoryScreenProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const playerRef = useRef<ReactPlayer>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { status, error, nextScene } = useStory(theme)

  useEffect(() => {
    if (isQuitConfirmationOpen) {
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
    }
  }, [isQuitConfirmationOpen])

  useEffect(() => {
    if (status?.result?.narration_audio) {
      const audioElement = audioRef.current
      if (audioElement) {
        audioElement.src = `data:audio/mp3;base64,${status.result.narration_audio}`
        if (isPlaying) {
          audioElement.play().catch(console.error)
        }
      }
    }
  }, [status?.result?.narration_audio, isPlaying])

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }

  const handleVideoEnd = () => {
    setVideoEnded(true)
    setIsPlaying(false)
  }

  const handleChoiceSelect = async (action: string) => {
    setVideoEnded(false)
    setIsPlaying(true)
    await nextScene(action)
  }

  if (!status || status.status === "processing") {
    return <LoadingScreen />
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-gradient-to-b from-[#1A2A3A] via-[#223344] to-[#1A2A3A]">
      {/* Quit Button */}
      <Button
        onClick={onQuit}
        className="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/30 dark:bg-[#2B4C6F]/20 dark:hover:bg-[#2B4C6F]/30 rounded-full p-2"
      >
        <XIcon className="w-5 h-5 text-white" />
      </Button>

      <div className="relative w-full flex-grow overflow-hidden border-t-4 border-b-4 border-[#B8D1E5] dark:border-[#5A7A99]">
        <ReactPlayer
          ref={playerRef}
          url={status.result?.video}
          playing={isPlaying}
          muted={true}
          width="100%"
          height="100%"
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          onEnded={handleVideoEnd}
        />
        <audio ref={audioRef} muted={isMuted} />
        
        <button
          onClick={toggleMute}
          className="absolute bottom-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30"
        >
          {isMuted ? <VolumeXIcon className="text-white" /> : <VolumeIcon className="text-white" />}
        </button>
      </div>

      <div className="p-4 text-white">
        <p className="text-lg mb-4">{status.result?.narration_text}</p>
        {videoEnded && (
          <div className="flex flex-wrap gap-4">
            {status.result?.actions.map((action, index) => (
              <Button
                key={index}
                onClick={() => handleChoiceSelect(action)}
                className="flex-1 min-w-[200px] bg-white/20 hover:bg-white/30"
              >
                {action}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
