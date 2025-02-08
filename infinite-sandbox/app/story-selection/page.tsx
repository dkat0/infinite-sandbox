"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import DarkModeToggle from "@/components/DarkModeToggle"

interface StoryCard {
  id: string
  title: string
  description: string
  imageUrl: string
}

const storyCards: StoryCard[] = [
  {
    id: "1",
    title: "The Clockwork Conspiracy",
    description:
      "Unravel a steampunk mystery in Victorian London as you navigate a world of gears, gadgets, and shadowy figures.",
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
  {
    id: "2",
    title: "Echoes of Eternity",
    description:
      "Embark on an epic space opera spanning galaxies and millennia, where your choices shape the fate of civilizations.",
    imageUrl: "/placeholder.svg?height=200&width=400",
  },
]

export default function StorySelectionPage() {
  const router = useRouter()

  const handleStorySelect = (storyId: string) => {
    console.log(`Selected story: ${storyId}`)
    // Here you would implement the logic to load the selected story
    router.push("/story")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-[#E6EEF5] via-[#F0F5F9] to-[#E6EEF5] dark:from-[#1A2A3A] dark:via-[#223344] dark:to-[#1A2A3A] flex flex-col items-center justify-center p-4"
    >
      <DarkModeToggle />
      <h1 className="text-4xl md:text-5xl font-light text-[#2B4C6F]/80 dark:text-white/80 mb-12 tracking-[0.2em] uppercase text-center">
        Pick a Story
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
        {storyCards.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/80 dark:bg-[#2B4C6F]/80 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <Image
              src={story.imageUrl || "/placeholder.svg"}
              alt={story.title}
              width={400}
              height={200}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-[#2B4C6F] dark:text-white mb-2">{story.title}</h2>
              <p className="text-[#5A7A99] dark:text-white/70 mb-4">{story.description}</p>
              <Button
                onClick={() => handleStorySelect(story.id)}
                className="w-full bg-[#2B4C6F] dark:bg-white text-white dark:text-[#2B4C6F] hover:bg-[#3A5D80] dark:hover:bg-[#F0F5F9] transition-colors duration-300"
              >
                Begin This Story
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
      <Button
        onClick={() => router.push("/")}
        className="mt-12 bg-white/30 dark:bg-[#2B4C6F]/20 hover:bg-white/40 dark:hover:bg-[#2B4C6F]/30 
          text-[#2B4C6F] dark:text-white py-4 px-8 rounded-full transition duration-300 ease-out 
          hover:shadow-lg backdrop-blur-sm border border-[#B8D1E5] dark:border-[#5A7A99] tracking-widest uppercase"
      >
        Back to Home
      </Button>
    </motion.div>
  )
}

