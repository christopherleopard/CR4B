export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
}

export interface Document {
  id: string
  userId: string
  name: string
  fileUrl: string
  fileType: string
  createdAt: Date
}

export interface Proposal {
  id: string
  userId: string
  title: string
  client: string
  jobDescription: string
  generatedProposal: string
  status: "draft" | "sent" | "won" | "lost"
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  userId: string
  status: "active" | "canceled" | "past_due"
  plan: "free" | "pro" | "business"
  currentPeriodEnd: Date
}

export interface JobAnalysis {
  keywords: string[]
  requirements: string[]
  metrics: string[]
  strongWords: string[]
  industry: string
  businessType: string
}
