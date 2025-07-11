// Helper function to safely handle async operations
export async function safeAsync<T>(
  promise: Promise<T>,
  errorMessage = "An error occurred",
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    return [null, error instanceof Error ? error : new Error(String(error))]
  }
}

// Wrapper for API handlers to ensure proper error handling
export function withErrorHandling(handler: Function) {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error("API error:", error)
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
          digest: Math.abs(
            String(error)
              .split("")
              .reduce((a, b) => (a * 31 + b.charCodeAt(0)) | 0, 0),
          ),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  }
}
