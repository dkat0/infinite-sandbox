import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { storyId: string } }) {
  const storyId = params.storyId

  // Call your backend API to get the story status
  const response = await fetch(`http://infinite-sandbox.onrender.com/story_status/${storyId}`)
  const data = await response.json()

  return NextResponse.json(data)
}

