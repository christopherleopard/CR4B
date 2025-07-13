"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sparkles, AlertCircle, TestTube } from "lucide-react"
import JobDescriptionAnalysis from "@/components/proposal/job-description-analysis"
import ProposalPreview from "@/components/proposal/proposal-preview"
import { makeAuthenticatedRequest } from "@/lib/api-client"

interface JobAnalysis {
  requirements: string[]
  metrics: string[]
  strongWords: string[]
  industry: string
  businessType: string
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NewProposal() {
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [customInstructions, setCustomInstructions] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null)
  const [generatedProposal, setGeneratedProposal] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages: Message[] = [...messages, { role: "user" as const, content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: newMessages }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setMessages([
      ...newMessages,
      { role: "assistant", content: data.aiMessage || "Sorry, I couldn't respond." }
    ]);
    setLoading(false);
  };

  const testOpenAI = async () => {
    setIsTesting(true)
    setError(null)

    try {
      const response = await fetch("/api/test-openai")
      const data = await response.json()

      if (response.ok) {
        setError(`✅ OpenAI Test Successful: ${data.response}`)
      } else {
        setError(`❌ OpenAI Test Failed: ${data.error} - ${data.details || ""}`)
      }
    } catch (err) {
      setError(`❌ Test Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsTesting(false)
    }
  }

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${data.details || "Failed to analyze job description"}`)
      }

      setAnalysis(data)
      setIsAnalyzed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred analyzing the job description")
      console.error("Analysis error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerate = async () => {
    if (!analysis) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await makeAuthenticatedRequest("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          jobDescription,
          analysis,
          customInstructions,
          jobTitle,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${data.details || "Failed to generate proposal"}`)
      }

      setGeneratedProposal(data.proposal)
      setIsGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred generating the proposal")
      console.error("Generation error:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="max-w-lg mx-auto border rounded p-4 space-y-4">
            <div className="space-y-2 h-64 overflow-y-auto bg-gray-50 p-2 rounded">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
                  <span className={msg.role === "user" ? "bg-blue-100" : "bg-gray-200"} style={{ padding: 4, borderRadius: 4 }}>
                    <b>{msg.role === "user" ? "You" : "AI"}:</b> {msg.content}
                  </span>
                </div>
              ))}
              {loading && <div className="text-gray-400">AI is typing...</div>}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded p-2"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                disabled={loading}
              />
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={sendMessage}
                disabled={loading}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
