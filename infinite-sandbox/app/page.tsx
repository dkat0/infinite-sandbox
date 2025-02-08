"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons"
import HelpPopup from "@/components/HelpPopup"
import DarkModeToggle from "@/components/DarkModeToggle"
import GenreScroller from "@/components/GenreScroller"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [prompt, setPrompt] = useState("")
  const [showHelp, setShowHelp] = useState(false)
  const [showError, setShowError] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() === "") {
      setShowError(true)
      inputRef.current?.classList.add("animate-wiggle")
      setTimeout(() => {
        inputRef.current?.classList.remove("animate-wiggle")
      }, 500)
    } else {
      router.push("/story")
    }
  }

  const handleGenreSelect = (genre: string) => {
    setPrompt((prevPrompt) => `${prevPrompt} ${genre}`.trim())
    setShowError(false)
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value)
    setShowError(false)
  }

  const handleTakeMeToWorld = () => {
    setShowError(false)
    router.push("/story-selection")
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E6EEF5] via-[#F0F5F9] to-[#E6EEF5] dark:from-[#1A2A3A] dark:via-[#223344] dark:to-[#1A2A3A]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,160,255,0.1),rgba(255,255,255,0)_50%)] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(30,40,80,0.2),rgba(0,0,0,0)_50%)]" />
      </div>

      <DarkModeToggle />

      <div className="relative z-10 flex flex-col items-center px-4 w-full">
        <h1 className="text-7xl font-light text-[#2B4C6F]/80 dark:text-white/80 mb-12 tracking-[0.2em] uppercase text-center w-full">
          Infinite Sandbox
        </h1>
        <GenreScroller onGenreSelect={handleGenreSelect} />
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter your story prompt..."
              value={prompt}
              onChange={handlePromptChange}
              className="w-full py-6 px-6 rounded-full text-lg bg-white/40 dark:bg-[#2B4C6F]/20 backdrop-blur-sm 
                border-[#B8D1E5] dark:border-[#5A7A99] focus:border-[#8BACC9] focus:ring-[#8BACC9] 
                dark:focus:border-[#7A9AC9] dark:focus:ring-[#7A9AC9] placeholder:text-[#5A7A99]/50 
                dark:placeholder:text-white/30 text-[#2B4C6F] dark:text-white tracking-wider uppercase"
            />
            <Button
              type="button"
              onClick={() => setShowHelp(true)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-white/30 
                dark:hover:bg-[#2B4C6F]/30 text-[#5A7A99] dark:text-white/70 hover:text-[#2B4C6F] 
                dark:hover:text-white transition-colors"
            >
              <QuestionMarkCircledIcon className="w-6 h-6" />
            </Button>
          </div>
          {showError && (
            <p className="text-red-500 dark:text-red-400 mt-2 text-sm">Please enter a prompt or select a theme</p>
          )}
          <Button
            type="submit"
            className="w-full mt-4 bg-white/30 dark:bg-[#2B4C6F]/20 hover:bg-white/40 dark:hover:bg-[#2B4C6F]/30 
              text-[#2B4C6F] dark:text-white py-6 px-6 rounded-full transition duration-300 ease-out 
              hover:shadow-lg backdrop-blur-sm border border-[#B8D1E5] dark:border-[#5A7A99] tracking-widest uppercase"
          >
            Begin Your Journey
          </Button>
        </form>
        <HelpPopup isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </div>
  )
}