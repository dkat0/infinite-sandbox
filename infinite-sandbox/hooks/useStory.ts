import { useState, useEffect, useRef } from "react"

interface StoryResult {
  video: string
  narration_audio: string
  narration_text: string
  actions: string[]
}

interface StoryStatus {
  status: "processing" | "completed" | "error"
  result?: StoryResult
}

export function useStory(theme?: string) {
  const [storyId, setStoryId] = useState<string | null>(null)
  const [status, setStatus] = useState<StoryStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  const initialize = async (theme: string) => {
    try {
      const response = await fetch("/api/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_theme: theme }),
      })
      if (!response.ok) throw new Error("Failed to initialize story")
      const data = await response.json()
      setStoryId(data.story_id)
      setStatus({ status: "processing" })
    } catch (err) {
      setError("Failed to initialize story")
    }
  }

  const pollStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/story_status/${id}`)
      if (!response.ok) throw new Error("Failed to fetch story status")
      const data = await response.json()
      setStatus(data)
      return data.status
    } catch (err) {
      setError("Failed to fetch story status")
      return "error"
    }
  }

  const nextScene = async (action: string) => {
    if (!storyId) return

    try {
      const response = await fetch("/api/next_scene", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ story_id: storyId, user_action: action }),
      })
      if (!response.ok) throw new Error("Failed to progress to next scene")
      const data = await response.json()
      setStatus({ status: "processing" })
    } catch (err) {
      setError("Failed to progress to next scene")
    }
  }

  useEffect(() => {
    if (theme && !hasInitialized.current) {
      hasInitialized.current = true
      initialize(theme)
    }
  }, [theme])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (storyId && status?.status === "processing") {
      intervalId = setInterval(async () => {
        const currentStatus = await pollStatus(storyId)
        if (currentStatus === "completed" || currentStatus === "error") {
          if (intervalId) clearInterval(intervalId)
        }
      }, 5000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [storyId, status?.status])

  return { storyId, status, error, nextScene }
} 