import { NextResponse } from "next/server"
import { withErrorHandling } from "@/lib/error-handling"

export const POST = withErrorHandling(async (req: Request) => {
  const { jobDescription } = await req.json()

  if (!jobDescription || jobDescription.trim() === "") {
    return NextResponse.json({ error: "Job description is required" }, { status: 400 })
  }

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not configured")
    return NextResponse.json({ error: "AI service is not properly configured" }, { status: 500 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  console.log("Analyze - API Key prefix:", apiKey.substring(0, 7))

  try {
    // Use direct fetch to OpenAI API instead of AI SDK
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
            role: "system",
            content:
              "You are a job description analyzer. Return only valid JSON with no additional text or formatting.",
          },
          {
            role: "user",
            content: `
                Analyze the following job description and extract key information.
                
                Return ONLY a valid JSON object with this exact structure:
                {
                  "requirements": ["requirement1", "requirement2"],
                  "metrics": ["metric1", "metric2"],
                  "strongWords": ["word1", "word2"],
                  "industry": "industry name",
                  "businessType": "business type"
                }
                
                Extract:
                1. Requirements: Skills, experience, technologies mentioned
                2. Metrics: Numbers like years of experience, project counts, timelines
                3. Strong words: MUST, SHOULD, REQUIRED, ESSENTIAL, etc.
                4. Industry: What industry/sector is this for
                5. Business type: Type of company/organization
                
                Job Description:
                ${jobDescription}
              `,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    console.log("OpenAI API response:", data)

    if (!response.ok) {
      console.error("OpenAI API error:", data)
      return NextResponse.json(
        {
          error: "OpenAI API error",
          details: data.error?.message || data.error || "Unknown API error",
          status: response.status,
        },
        { status: 500 },
      )
    }

    const aiResponse = data.choices[0]?.message?.content
    if (!aiResponse) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 })
    }

    console.log("AI Response:", aiResponse)

    // Parse the JSON response
    let analysis
    try {
      // Clean the response - remove any markdown formatting
      const cleanedText = aiResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      analysis = JSON.parse(cleanedText)

      // Validate the structure and provide defaults if needed
      analysis = {
        requirements: Array.isArray(analysis.requirements) ? analysis.requirements : ["General experience required"],
        metrics: Array.isArray(analysis.metrics) ? analysis.metrics : ["Experience level not specified"],
        strongWords: Array.isArray(analysis.strongWords) ? analysis.strongWords : ["Required"],
        industry: typeof analysis.industry === "string" ? analysis.industry : "General",
        businessType: typeof analysis.businessType === "string" ? analysis.businessType : "Company",
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      console.error("Raw AI response:", aiResponse)

      // Fallback analysis if parsing fails
      analysis = {
        requirements: ["Experience in relevant field", "Technical skills", "Communication skills"],
        metrics: ["Years of experience required"],
        strongWords: ["Required", "Must have"],
        industry: "Technology",
        businessType: "Company",
      }
    }

    return NextResponse.json(analysis)
  } catch (fetchError: any) {
    console.error("Fetch error:", fetchError)
    return NextResponse.json(
      {
        error: "Network error communicating with AI service",
        details: fetchError.message,
      },
      { status: 500 },
    )
  }
})
