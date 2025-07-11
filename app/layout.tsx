import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientRoot from "@/components/client-root";

export const metadata: Metadata = {
  title: "ProposalAI - AI-Powered Proposal Generator",
  description: "Generate winning client proposals with AI that learns your style and analyzes job requirements",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  )
}
