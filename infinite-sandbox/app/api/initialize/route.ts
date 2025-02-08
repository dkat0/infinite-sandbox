import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { user_theme } = await request.json()

  const response = await fetch("http://infinite-sandbox.onrender.com/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_theme }),
  })

  const data = await response.json()
  return NextResponse.json(data)
}

