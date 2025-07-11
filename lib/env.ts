// Helper to check if required environment variables are set
export function checkRequiredEnvVars() {
  const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "OPENAI_API_KEY"]

  const missing = requiredVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`)
    console.error("Please check your .env.local file or environment configuration")
    return false
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  if (supabaseUrl && !supabaseUrl.includes("supabase.co")) {
    console.error("NEXT_PUBLIC_SUPABASE_URL appears to be invalid (should contain supabase.co)")
    return false
  }

  // Validate Supabase key format
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  if (supabaseKey && (!supabaseKey.startsWith("eyJ") || supabaseKey.length < 100)) {
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (should start with eyJ and be long)")
    return false
  }

  // Validate OpenAI API key format
  const openaiKey = process.env.OPENAI_API_KEY || ""
  if (openaiKey && (!openaiKey.startsWith("sk-") || openaiKey.length < 20)) {
    console.error("OPENAI_API_KEY appears to be invalid (should start with sk- and be at least 20 chars)")
    return false
  }

  return true
}

// Get environment variables with type safety
export function getEnv(key: string, defaultValue = ""): string {
  const value = process.env[key] || defaultValue
  if (!value) {
    console.warn(`Environment variable ${key} is not set`)
  }
  return value
}

// Validate environment on startup
export function validateEnvironment() {
  const isValid = checkRequiredEnvVars()

  if (!isValid) {
    throw new Error("Environment validation failed. Please check your environment variables.")
  }

  console.log("✅ Environment validation passed")
  return true
}
