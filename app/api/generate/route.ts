import { NextResponse } from "next/server"
import { withErrorHandling } from "@/lib/error-handling"
import { createClient } from "@supabase/supabase-js"

export function createServerSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  )
}

export const POST = withErrorHandling(async (req: Request) => {
  try {
    const { jobDescription, analysis, customInstructions, jobTitle } = await req.json()

    if (!jobDescription || jobDescription.trim() === "") {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured")
      return NextResponse.json({ error: "AI service is not properly configured" }, { status: 500 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    console.log("Generate - API Key prefix:", apiKey.substring(0, 7))

    // Get user information from auth header
    const authHeader = req.headers.get("Authorization")
    let generalInstructions = ""
    let documentContext = ""

    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "")
        const supabase = createServerSupabase(token)

        const {
          data: { user },
        } = await supabase.auth.getUser(token)

        if (user) {
          // Get user's profile for general instructions
          const { data: profile } = await supabase
            .from("profiles")
            .select("general_instructions")
            .eq("id", user.id)
            .single()

          if (profile && typeof profile.general_instructions === "string") {
            generalInstructions = profile.general_instructions
          } else {
            generalInstructions = ""
          }

          // Get user's uploaded documents to learn their style (fetch public URLs and extract DOCX text)
          const { data: documents } = await supabase.from("documents").select("id, name, file_url, file_type").eq("user_id", user.id).limit(3)
          let extractedDocsText = [];
          if (documents && documents.length > 0) {
            for (const doc of documents) {
              if (doc.file_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                try {
                  const response = await fetch(doc.file_url);
                  if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const mammoth = await import("mammoth");
                    const { value: docxText } = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
                    extractedDocsText.push(`Document: ${doc.name}\n${docxText}`);
                  }
                } catch (e) {
                  console.error(`Failed to extract DOCX for ${doc.name}:`, e);
                }
              }
            }
          }
          if (extractedDocsText.length > 0) {
            documentContext = `The user has uploaded ${(documents ?? []).length} document(s) including: ${(documents ?? []).map((d) => d.name).join(", ")}.\nExtracted content:\n${extractedDocsText.join("\n---\n")}`;
          }
        }
      } catch (authError) {
        console.error("Auth error:", authError)
        // Continue without user context if auth fails
      }
    }

    try {
      // Use direct fetch to OpenAI API
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
                "You are an expert proposal writer. Create compelling, professional proposals based on job descriptions and analysis.",
            },
            {
              role: "user",
              content: `
                Create a compelling proposal for the following job posting.
                
                Job Title: ${jobTitle || "Not specified"}
                
                Job Description:
                ${jobDescription}
                
                Analysis Results:
                - Requirements: ${analysis.requirements.join(", ")}
                - Key Metrics: ${analysis.metrics.join(", ")}
                - Strong Words: ${analysis.strongWords.join(", ")}
                - Industry: ${analysis.industry}
                - Business Type: ${analysis.businessType}
                
                ${generalInstructions ? `User's General Instructions (apply to all proposals):\n${generalInstructions}\n` : ""}
                
                ${documentContext ? `Document Context:\n${documentContext}\n` : ""}
                
                ${customInstructions ? `Custom Instructions (specific to this proposal):\n${customInstructions}\n` : ""}
                
                Create a professional proposal that:
                1. Starts with a strong opening sentence that includes key requirements and metrics from the analysis
                2. Addresses the client's specific needs and requirements
                3. Includes a technical approach section explaining how you'll implement the solution
                4. Provides a clear timeline and deliverables
                5. Mentions relevant past experience or examples
                6. Ends with a call to action
                7. Uses the strong words and metrics identified in the analysis naturally throughout
                8. Shows understanding of their industry and business type
                
                Keep the proposal professional, short, concise, and compelling. Format it with proper paragraphs and structure.
              `,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      })

      // Log the prompt sent to OpenAI for debugging
      console.log("Prompt sent to OpenAI:", JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert proposal writer. Create compelling, professional proposals based on job descriptions and analysis.",
          },
          {
            role: "user",
            content: `
                Create a compelling proposal for the following job posting.
                
                Job Title: ${jobTitle || "Not specified"}
                
                Job Description:
                ${jobDescription}
                
                Analysis Results:
                - Requirements: ${analysis.requirements.join(", ")}
                - Key Metrics: ${analysis.metrics.join(", ")}
                - Strong Words: ${analysis.strongWords.join(", ")}
                - Industry: ${analysis.industry}
                - Business Type: ${analysis.businessType}
                
                ${generalInstructions ? `User's General Instructions (apply to all proposals):\n${generalInstructions}\n` : ""}
                
                ${documentContext ? `Document Context:\n${documentContext}\n` : ""}
                
                ${customInstructions ? `Custom Instructions (specific to this proposal):\n${customInstructions}\n` : ""}
                
                Create a professional proposal that:
                1. Starts with a strong opening sentence that includes key requirements and metrics from the analysis
                2. Addresses the client's specific needs and requirements
                3. Includes a technical approach section explaining how you'll implement the solution
                4. Provides a clear timeline and deliverables
                5. Mentions relevant past experience or examples
                6. Ends with a call to action
                7. Uses the strong words and metrics identified in the analysis naturally throughout
                8. Shows understanding of their industry and business type
                
                Keep the proposal professional, concise, and compelling. Format it with proper paragraphs and structure.
              `,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }, null, 2));

      const data = await response.json()
      console.log("Generate - OpenAI API response status:", response.status)

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

      const proposal = data.choices[0]?.message?.content
      if (!proposal) {
        return NextResponse.json({ error: "No proposal generated" }, { status: 500 })
      }

      return NextResponse.json({ proposal })
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
  } catch (error: any) {
    console.error("Error generating proposal:", error)
    return NextResponse.json(
      {
        error: "Failed to generate proposal",
        details: error.message,
      },
      { status: 500 },
    )
  }
})
