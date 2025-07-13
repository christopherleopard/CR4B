"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProposalPage() {
  const { proposal: proposalId } = useParams();
  const [proposalData, setProposalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<{ mistakes: string; updated: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", proposalId)
        .single();

      if (error) {
        console.error("Error fetching proposal:", error);
        setProposalData(null);
      } else {
        setProposalData(data);
      }
      setLoading(false);
    };

    if (proposalId) fetchProposal();
  }, [proposalId]);

  const handleRewrite = async () => {
    if (!proposalData) return;
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const response = await fetch("/api/openai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: proposalData.job_title,
          jobDescription: proposalData.job_description,
          failedProposal: proposalData.proposal,
        }),
      });
      const result = await response.json();
      setAiAnalysis(result);
    } catch (err) {
      setAiAnalysis({ mistakes: "Error analyzing proposal.", updated: "" });
    }
    setAiLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!proposalData) {
    return <div className="p-8 text-center text-gray-500">Proposal not found.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{proposalData.job_title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <strong>Job Description:</strong>
          <div className="prose max-w-none whitespace-pre-wrap">{proposalData.job_description}</div>
        </div>
        <div>
          <strong>Proposal:</strong>
          <div className="prose max-w-none whitespace-pre-wrap">{proposalData.proposal}</div>
        </div>
        <div className="mt-8">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleRewrite}
            disabled={aiLoading}
          >
            {aiLoading ? "Rewriting..." : "Rewrite Proposal with AI"}
          </button>
        </div>
        {aiAnalysis && (
          <div className="mt-8">
            <div className="p-6 mb-4">
              <h3 className="text-lg font-bold mb-2">What I made mistake when generating proposals</h3>
              <div className="mb-6 whitespace-pre-line">{aiAnalysis.mistakes}</div>
            </div>
            <div className="flex">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2">Original proposal</h3>
                <div className="prose max-w-none whitespace-pre-wrap">{proposalData.proposal}</div>
              </div>
              <div className="p-6 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-bold mb-2">Updated proposal</h3>
                <div className="prose max-w-none whitespace-pre-wrap">{aiAnalysis.updated}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}