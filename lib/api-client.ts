import { createClientSupabase } from "./supabase"

// Helper function to make authenticated API requests
export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const supabase = createClientSupabase()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error("No authentication token available")
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  }

  // Don't override Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"]
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
