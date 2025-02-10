import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { user_theme } = await request.json()

  try {
    const response = await fetch("https://infinite-sandbox.onrender.com/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_theme }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in initialize:", error)
    return NextResponse.json({ error: "Failed to initialize story" }, { status: 500 })
  }
}

