import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase"; // or your supabase helper

export const POST = async (req: Request) => {
  const { messages, userId } = await req.json();

  // 1. Fetch user info from DB
  const supabase = createServerSupabase(/* pass token if needed */);
  const { data: profile } = await supabase
    .from("profiles")
    .select("general_instructions")
    .eq("id", userId)
    .single();

  // 2. Prepend general instructions to the chat
  const systemPrompt = profile?.general_instructions
    ? `User's General Instructions: ${profile.general_instructions}`
    : "You are a helpful assistant.";

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  // 3. Call OpenAI as before
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: openaiMessages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data.error }, { status: 500 });
  }

  const aiMessage = data.choices[0]?.message?.content;
  return NextResponse.json({ aiMessage });
};