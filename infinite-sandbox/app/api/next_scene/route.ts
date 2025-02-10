import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { story_id, user_action } = await request.json()

  try {
    const response = await fetch("https://infinite-sandbox.onrender.com/next_scene", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ story_id, user_action }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in next scene:", error)
    return NextResponse.json({ error: "Failed to progress to next scene" }, { status: 500 })
  }
}

