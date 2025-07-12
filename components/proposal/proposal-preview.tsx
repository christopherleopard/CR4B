"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Copy, Send, Save } from "lucide-react"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js";

interface ProposalPreviewProps {
  proposal: string
  jobTitle: string
  jobDescription: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProposalPreview({ proposal, jobTitle, jobDescription }: ProposalPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proposal)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([proposal], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "proposal.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleSend = async () => {
    const botToken = "8017883714:AAGIIIe0Ezl5qt3MX3JYLBTG8c2zCR1e9z0";
    const chatId = "-4850844596";
    const message = `Job Title: ${jobTitle}\nJob Description: ${jobDescription}\n\nProposal:\n${proposal}`;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        console.log("Proposal sent via Telegram!");
      } else {
        console.log("Failed to send proposal: " + data.description);
      }
    } catch (err) {
      console.error("Telegram send error:", err);
    }
  };

  const handleSave = async () => {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to save.");
      return;
    }

    const { error } = await supabase
      .from("proposals") // replace with your actual table name
      .insert([
        {
          user_id: user.id,
          job_title: jobTitle,
          job_description: jobDescription,
          proposal: proposal,
        },
      ]);

    if (error) {
      console.error("Error saving proposal:", error);
      alert("Failed to save proposal.");
    } else {
      alert("Proposal saved successfully!");
    }
  };

  if (!proposal) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No proposal generated yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Generated Proposal</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleSend}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button size="sm" variant="destructive" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="prose max-w-none whitespace-pre-wrap">{proposal}</div>
        </CardContent>
      </Card>
    </div>
  )
}
