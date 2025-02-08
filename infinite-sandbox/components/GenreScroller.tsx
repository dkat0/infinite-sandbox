"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const genres = [
  "Fantasy",
  "Sci-Fi",
  "Mystery",
  "Thriller",
  "Horror",
  "Romance",
  "Adventure",
  "Historical Fiction",
  "Cyberpunk",
  "Steampunk",
  "Dystopian",
  "Post-Apocalyptic",
  "Superhero",
  "Urban Fantasy",
  "Space Opera",
  "Time Travel",
  "Alternate History",
  "Magical Realism",
  "Noir",
  "Western",
  "Spy Fiction",
  "Military Sci-Fi",
]

interface GenreScrollerProps {
  onGenreSelect: (genre: string) => void
}

export default function GenreScroller({ onGenreSelect }: GenreScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    let animationFrameId: number

    const scroll = () => {
      if (!isHovered) {
        setScrollPosition((prevPosition) => {
          const newPosition = prevPosition + 0.5
          if (newPosition >= scrollElement.scrollWidth / 2) {
            return 0
          }
          return newPosition
        })
      }
      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isHovered])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollPosition
    }
  }, [scrollPosition])

  return (
    <div
      className="relative w-full max-w-3xl mb-6 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={scrollRef} className="flex space-x-2 px-4 overflow-x-hidden">
        {[...genres, ...genres].map((genre, index) => (
          <Button
            key={`${genre}-${index}`}
            onClick={() => onGenreSelect(genre)}
            variant="outline"
            className="bg-[#2B4C6F] dark:bg-white/80 hover:bg-[#3A5D80] dark:hover:bg-white 
              text-white dark:text-[#2B4C6F] border-[#5A7A99] dark:border-[#B8D1E5] 
              backdrop-blur-sm transition-colors duration-200 whitespace-nowrap"
          >
            {genre}
          </Button>
        ))}
      </div>
    </div>
  )
}

