"use client"

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: number;
  created_at: string;
  title: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Chat() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1">
        <div className="lg:col-span-1 space-y-6">
          <div className="mx-auto border rounded p-4 space-y-4">
            <div className="space-y-2 min-h-[800px] overflow-y-auto bg-gray-50 p-2 rounded">
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
