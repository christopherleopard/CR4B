import { NextResponse } from "next/server"
import { checkRequiredEnvVars } from "@/lib/env"
import { createServerSupabase } from "@/lib/supabase"

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      env: { status: "unknown", message: "" },
      supabase: { status: "unknown", message: "" },
      openai: { status: "unknown", message: "" },
    },
  }

  // Check environment variables
  try {
    const envCheck = checkRequiredEnvVars()
    health.services.env.status = envCheck ? "ok" : "error"
    health.services.env.message = envCheck ? "All required variables set" : "Missing required variables"
  } catch (error) {
    health.services.env.status = "error"
    health.services.env.message = error instanceof Error ? error.message : "Unknown error"
  }

  // Check Supabase connection
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase.from("profiles").select("count", { count: "exact", head: true })

    if (error) throw error
    health.services.supabase.status = "ok"
    health.services.supabase.message = "Connection successful"
  } catch (error) {
    health.services.supabase.status = "error"
    health.services.supabase.message = error instanceof Error ? error.message : "Unknown error"
  }

  // Check OpenAI configuration
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("API key not configured")

    health.services.openai.status = apiKey.startsWith("sk-") ? "configured" : "invalid"
    health.services.openai.message = apiKey.startsWith("sk-") ? "API key format valid" : "Invalid API key format"
  } catch (error) {
    health.services.openai.status = "error"
    health.services.openai.message = error instanceof Error ? error.message : "Unknown error"
  }

  // Set overall status
  const hasErrors = Object.values(health.services).some(
    (service) => service.status === "error" || service.status === "invalid",
  )

  health.status = hasErrors ? "error" : "ok"

  return NextResponse.json(health, {
    status: hasErrors ? 500 : 200,
  })
}
