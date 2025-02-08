import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { story_id, user_action } = await request.json()

  const response = await fetch("http://infinite-sandbox.onrender.com/next_scene", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ story_id, user_action }),
  })

  const data = await response.json()
  return NextResponse.json(data)
}

