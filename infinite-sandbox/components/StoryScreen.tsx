"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { VolumeIcon, VolumeXIcon } from "lucide-react"
import ReactPlayer from "react-player"

interface Choice {
  id: string
  text: string
}

interface InteractiveStoryScreenProps {
  onQuit: () => void
  isQuitConfirmationOpen: boolean
}

export default function InteractiveStoryScreen({ onQuit, isQuitConfirmationOpen }: InteractiveStoryScreenProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [choices, setChoices] = useState<Choice[]>([
    { id: "1", text: "Choice 1 with some longer text to demonstrate sizing" },
    { id: "2", text: "Choice 2" },
  ])
  const [videoUrl, setVideoUrl] = useState("placeholder.mp4")
  const [audioUrl, setAudioUrl] = useState("placeholder.mp3")
  const [narrationText, setNarrationText] = useState(
    "On a stormy London night, Elliot returned to his workshop… but something was amiss. A letter—unmarked, unexpected—rested on his workbench. He unfolded it, and the words sent a chill down his spine… 'The timepiece holds the key. Midnight approaches. Trust no one.'",
  )
  const [isPlaying, setIsPlaying] = useState(true)
  const [audioEnded, setAudioEnded] = useState(false)
  const playerRef = useRef<ReactPlayer>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const narrationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isQuitConfirmationOpen) {
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
    }
  }, [isQuitConfirmationOpen])

  useEffect(() => {
    const audioElement = audioRef.current
    if (audioElement) {
      audioElement.muted = isMuted

      const playAudio = () => {
        if (isPlaying && !audioEnded && audioUrl) {
          audioElement.src = audioUrl
          const playPromise = audioElement.play()
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error("Audio playback failed:", error)
              // If autoplay is not allowed, mute the audio and try again
              if (error.name === "NotAllowedError") {
                audioElement.muted = true
                audioElement.play().catch((e) => console.error("Audio playback failed even when muted:", e))
              }
            })
          }
        } else {
          audioElement.pause()
        }
      }

      playAudio()

      audioElement.onended = () => {
        setAudioEnded(true)
      }
    }
  }, [isPlaying, isMuted, audioEnded, audioUrl])

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  const handleVideoProgress = (state: { played: number; playedSeconds: number }) => {
    if (audioRef.current && !isNaN(state.playedSeconds)) {
      audioRef.current.currentTime = state.playedSeconds
    }
  }

  const handleVideoEnd = () => {
    setVideoEnded(true)
  }

  const handleChoiceSelect = (choiceId: string) => {
    console.log(`Selected choice: ${choiceId}`)
    // Here you would implement the logic to load the next video based on the choice
    // For now, we'll just reset the current video
    if (playerRef.current) {
      playerRef.current.seekTo(0)
      setIsPlaying(true)
      setVideoEnded(false)
      setAudioEnded(false)
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => console.error("Audio playback failed:", error))
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-gradient-to-b from-[#1A2A3A] via-[#223344] to-[#1A2A3A]">
      <div className="relative w-full flex-grow overflow-hidden border-t-4 border-b-4 border-[#B8D1E5] dark:border-[#5A7A99]">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={isPlaying}
          muted={true}
          width="100%"
          height="100%"
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          onProgress={handleVideoProgress}
          onEnded={handleVideoEnd}
        />
        <audio ref={audioRef} onEnded={() => setAudioEnded(true)} />
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
        {videoEnded && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-md">
            <div className="flex justify-center items-stretch w-full max-w-4xl px-4">
              {choices.map((choice) => (
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
      </div>
      <div
        ref={narrationRef}
        className="w-full bg-[#1A2A3A]/80 backdrop-blur-sm flex items-center justify-center px-4 py-4 overflow-y-auto"
        style={{ maxHeight: "20vh" }}
      >
        <div className="text-white text-lg text-center max-w-full">{narrationText}</div>
      </div>
    </div>
  )
}
