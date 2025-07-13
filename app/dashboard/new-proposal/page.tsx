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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Create New Proposal</h1>
          <p className="text-gray-500">Generate a tailored proposal based on job description</p>
        </div>
        <Button onClick={testOpenAI} disabled={isTesting} variant="outline">
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Test OpenAI
            </>
          )}
        </Button>
      </div>

      {error && (
        <div
          className={`mb-6 p-4 border rounded-md flex items-center ${
            error.startsWith("✅") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          <AlertCircle className={`h-5 w-5 mr-2 ${error.startsWith("✅") ? "text-green-500" : "text-red-500"}`} />
          <p className={error.startsWith("✅") ? "text-green-600" : "text-red-600"}>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
              <CardDescription>Paste the job description to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input
                    id="job-title"
                    placeholder="E.g., WordPress Developer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-description">Job Description</Label>
                  <Textarea
                    id="job-description"
                    placeholder="Paste the full job description here..."
                    className="min-h-[300px]"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>

                <Button onClick={handleAnalyze} disabled={!jobDescription.trim() || isAnalyzing} className="w-full">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Job Description"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isAnalyzed && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Instructions</CardTitle>
                <CardDescription>Add specific instructions for this proposal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="E.g., Focus on my WordPress experience, mention my portfolio site, keep it under 300 words..."
                    className="min-h-[100px]"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                  />

                  <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Proposal
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {!isAnalyzed ? (
            <div className="h-full flex items-center justify-center border rounded-lg p-8 bg-gray-50">
              <div className="text-center">
                <p className="text-gray-500">Paste a job description and click "Analyze" to get started</p>
                <p className="text-sm text-gray-400 mt-2">Or click "Test OpenAI" to verify the AI integration</p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="analysis">
              <TabsList className="mb-4">
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="proposal" disabled={!isGenerated}>
                  Proposal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analysis">
                <JobDescriptionAnalysis analysis={analysis} />
              </TabsContent>

              <TabsContent value="proposal">
                <ProposalPreview proposal={generatedProposal} jobTitle={jobTitle} jobDescription={jobDescription} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
