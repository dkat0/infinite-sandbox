import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { storyId: string } }) {
  const storyId = params.storyId

  try {
    const response = await fetch(`https://infinite-sandbox.onrender.com/story_status/${storyId}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error("Error in story status:", error)
    return NextResponse.json({ error: "Failed to fetch story status" }, { status: 500 })
  }
}

