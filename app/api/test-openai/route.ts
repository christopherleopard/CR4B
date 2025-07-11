import { NextResponse } from "next/server"

export const GET = async () => {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured",
          configured: false,
        },
        { status: 500 },
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    console.log("API Key prefix:", apiKey.substring(0, 7))
    console.log("API Key length:", apiKey.length)

    // Test with direct fetch to OpenAI API first
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: 'Say \'Hello, OpenAI is working!\' in JSON format: {"message": "your response"}',
            },
          ],
          max_tokens: 50,
          temperature: 0.1,
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000),
      })

      const data = await response.json()
      console.log("Direct OpenAI response:", data)

      if (!response.ok) {
        return NextResponse.json(
          {
            error: "Direct OpenAI API error",
            details: data.error?.message || data.error || "Unknown error",
            status: response.status,
            configured: true,
            apiKeyPrefix: apiKey.substring(0, 7) + "...",
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        configured: true,
        response: data.choices[0]?.message?.content || "No content",
        apiKeyPrefix: apiKey.substring(0, 7) + "...",
      })
    } catch (directError: any) {
      console.error("Direct API error:", directError)
      return NextResponse.json(
        {
          error: "Direct OpenAI API error",
          details: directError.message,
          configured: true,
          apiKeyPrefix: apiKey.substring(0, 7) + "...",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Test endpoint error:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
