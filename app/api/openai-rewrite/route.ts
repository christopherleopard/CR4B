import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const { jobTitle, jobDescription, failedProposal } = await req.json();

  // Compose prompt for OpenAI
  const prompt = `You are an expert proposal reviewer and writer. A user submitted the following proposal for a job, but it was not successful.\n\nJob Title: ${jobTitle}\nJob Description: ${jobDescription}\n\nFailed Proposal:\n${failedProposal}\n\n1. Analyze the failed proposal and explain what mistakes or weaknesses caused it to fail.\n2. Rewrite the proposal to maximize the chance of success for this job.\n\nRespond in this format:\nMistakes:\n<list mistakes>\n\nUpdated Proposal:\n<new proposal>`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert proposal reviewer and writer." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ mistakes: "OpenAI error", updated: "" }, { status: 500 });
  }

  // Parse response
  const content = data.choices?.[0]?.message?.content || "";
  // Split response into mistakes and updated proposal
  const [mistakesPart, updatedPart] = content.split(/Updated Proposal:/i);
  const mistakes = mistakesPart?.replace(/Mistakes:/i, "").trim();
  const updated = updatedPart?.trim() || "";

  return NextResponse.json({ mistakes, updated });
};
