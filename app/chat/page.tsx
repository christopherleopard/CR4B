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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch chat sessions (history)
  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("created_at", { ascending: false });
      setSessions(data || []);
    };
    fetchSessions();
  }, []);

  // Fetch messages for selected session
  useEffect(() => {
    if (selectedSession === null) {
      setMessages([{ role: "assistant", content: "Hello! How can I help you today?" }]);
      return;
    }
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role,content")
        .eq("session_id", selectedSession)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();
  }, [selectedSession]);

  // Start a new chat session
  const handleNewChat = async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert([{ title: "New Chat" }])
      .select()
      .single();
    if (data) {
      setSelectedSession(data.id);
      setSessions([data, ...sessions]);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Save user message
    if (selectedSession) {
      await supabase.from("chat_messages").insert([
        { session_id: selectedSession, role: "user", content: input }
      ]);
    }

    // Get AI response
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: newMessages }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    const aiMessage = data.aiMessage || "Sorry, I couldn't respond.";
    setMessages([...newMessages, { role: "assistant", content: aiMessage }]);

    // Save AI message
    if (selectedSession) {
      await supabase.from("chat_messages").insert([
        { session_id: selectedSession, role: "assistant", content: aiMessage }
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r flex flex-col">
        <div className="p-4 border-b">
          <button
            className="w-full bg-blue-500 text-white py-2 rounded"
            onClick={handleNewChat}
          >
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul>
            {sessions.map(session => (
              <li
                key={session.id}
                className={`p-4 cursor-pointer hover:bg-blue-100 ${selectedSession === session.id ? "bg-blue-200 font-bold" : ""}`}
                onClick={() => setSelectedSession(session.id)}
              >
                {session.title || "Untitled"}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 space-y-2 bg-white">
          {messages.map((msg, idx) => (
            <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
              <span className={msg.role === "user" ? "bg-blue-100" : "bg-gray-200"} style={{ padding: 4, borderRadius: 4 }}>
                <b>{msg.role === "user" ? "You" : "AI"}:</b> {msg.content}
              </span>
            </div>
          ))}
          {loading && <div className="text-gray-400">AI is typing...</div>}
        </div>
        <div className="p-4 border-t flex gap-2">
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
  );
}