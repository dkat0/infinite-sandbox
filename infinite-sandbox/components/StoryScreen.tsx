"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { VolumeIcon, VolumeXIcon } from "lucide-react"
import ReactPlayer from "react-player"

interface Choice {
  id: string
  text: string
}

interface StoryContent {
  video: string
  narration_audio: string // This will be base64 encoded
  narration_text: string
  actions: Choice[]
}

interface InteractiveStoryScreenProps {
  onQuit: () => void
  isQuitConfirmationOpen: boolean
  storyId: string
}

export default function InteractiveStoryScreen({
  onQuit,
  isQuitConfirmationOpen,
  storyId,
}: InteractiveStoryScreenProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isChoiceLoading, setIsChoiceLoading] = useState(false)
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const playerRef = useRef<ReactPlayer>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    fetchStoryContent()
  }, [])

  useEffect(() => {
    if (isQuitConfirmationOpen) {
      setIsPlaying(false)
    } else if (storyContent) {
      setIsPlaying(true)
    }
  }, [isQuitConfirmationOpen, storyContent])

  useEffect(() => {
    if (storyContent && storyContent.narration_audio) {
      const audioBlob = base64ToBlob(storyContent.narration_audio, "audio/mp3")
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [storyContent])

  const fetchStoryContent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/story_status/${storyId}`)
      const data = await response.json()
      if (data.status === "completed") {
        setStoryContent(data.result)
        setIsLoading(false)
        setIsPlaying(true)
      } else if (data.status === "processing") {
        // Poll again after a short delay
        setTimeout(fetchStoryContent, 2000)
      } else {
        throw new Error("Failed to fetch story content")
      }
    } catch (error) {
      console.error("Failed to fetch story content:", error)
      setIsLoading(false)
    }
  }

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  const handleVideoEnd = () => {
    setVideoEnded(true)
  }

  const handleChoiceSelect = async (choiceId: string) => {
    setIsChoiceLoading(true)
    setVideoEnded(false)

    try {
      const response = await fetch("/api/next_scene", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story_id: storyId, user_action: choiceId }),
      })
      const data = await response.json()
      if (data.status === "processing") {
        // Start polling for the new content
        await fetchStoryContent()
      } else {
        throw new Error("Failed to process next scene")
      }
    } catch (error) {
      console.error("Failed to fetch next story content:", error)
    } finally {
      setIsChoiceLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white text-2xl">
        Loading your journey...
      </div>
    )
  }

  if (!storyContent) {
    return <div>Error loading story content</div>
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-gradient-to-b from-[#1A2A3A] via-[#223344] to-[#1A2A3A]">
      <div className="relative w-full flex-grow overflow-hidden border-t-4 border-b-4 border-[#B8D1E5] dark:border-[#5A7A99]">
        <ReactPlayer
          ref={playerRef}
          url={storyContent.video}
          playing={isPlaying}
          muted={isMuted}
          width="100%"
          height="100%"
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          onEnded={handleVideoEnd}
        />
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            autoPlay={isPlaying}
            muted={isMuted}
            onEnded={() => setVideoEnded(true)}
          />
        )}
        <div className="absolute top-4 right-4 flex space-x-2 z-30">
          <Button
            onClick={toggleMute}
            variant="secondary"
            size="icon"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
          >
            {isMuted ? <VolumeXIcon className="text-white" /> : <VolumeIcon className="text-white" />}
          </Button>
          <Button onClick={onQuit} className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm">
            Quit Story
          </Button>
        </div>
        {videoEnded && !isChoiceLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-md">
            <div className="flex justify-center items-stretch w-full max-w-4xl px-4">
              {storyContent.actions.map((choice) => (
                <Button
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice.id)}
                  className="flex-1 mx-2 bg-white/80 hover:bg-white text-[#2B4C6F] dark:bg-[#2B4C6F]/80 dark:hover:bg-[#2B4C6F] dark:text-white 
                    backdrop-blur-sm px-6 py-4 text-lg font-semibold rounded-md transition-all duration-300 ease-in-out
                    border-2 border-[#B8D1E5] dark:border-[#5A7A99] shadow-lg hover:shadow-xl
                    min-w-[150px] max-w-[300px] h-auto whitespace-normal"
                >
                  {choice.text}
                </Button>
              ))}
            </div>
          </div>
        )}
        {isChoiceLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-md">
            <div className="text-white text-2xl">What will happen next? Loading your choice...</div>
          </div>
        )}
      </div>
      <div
        className="w-full bg-[#1A2A3A]/80 backdrop-blur-sm flex items-center justify-center px-4 py-4 overflow-y-auto"
        style={{ maxHeight: "20vh" }}
      >
        <div className="text-white text-lg text-center max-w-full">{storyContent.narration_text}</div>
      </div>
    </div>
  )
}

