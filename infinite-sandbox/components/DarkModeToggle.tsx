"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDarkMode = localStorage.getItem("darkMode") === "true"
    setDarkMode(isDarkMode)
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem("darkMode", newDarkMode.toString())
    document.documentElement.classList.toggle("dark", newDarkMode)
  }

  return (
    <Button
      onClick={toggleDarkMode}
      className="fixed top-4 left-4 z-50 bg-white/20 dark:bg-[#2B4C6F]/20 backdrop-blur-sm 
        hover:bg-white/30 dark:hover:bg-[#2B4C6F]/30 text-[#2B4C6F] dark:text-white
        border border-[#B8D1E5] dark:border-[#5A7A99] rounded-full p-2"
    >
      {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </Button>
  )
}