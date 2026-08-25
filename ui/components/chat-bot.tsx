"use client"

import { useEffect, useRef, useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Send, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getFaqAnswer } from "@/lib/faq-bot"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface ChatMessage {
  role: "bot" | "user"
  text: string
}

const GREETING: ChatMessage = {
  role: "bot",
  text: "Hi! I'm the SoftwareYard bot. Ask me about our services, pricing, location, or careers.",
}

function reportUnmatched(message: string) {
  fetch(`${API_URL}/api/chat-bot/unmatched`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  }).catch(() => {})
}

interface ChatBotProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatBot({ open, onOpenChange }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage: ChatMessage = { role: "user", text: trimmed }
    const { answer, matched } = getFaqAnswer(trimmed)
    const botMessage: ChatMessage = { role: "bot", text: answer }

    setMessages((prev) => [...prev, userMessage, botMessage])
    setInput("")

    if (!matched) {
      reportUnmatched(trimmed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col",
            "w-[22rem] max-w-[calc(100vw-3rem)] h-[28rem] max-h-[calc(100vh-3rem)]",
            "bg-background border border-border rounded-2xl shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4",
            "focus:outline-none"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <DialogPrimitive.Title className="text-sm font-semibold text-foreground">
                Chat with SoftwareYard
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs text-muted-foreground">
                Quick answers to common questions
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="rounded-full p-1.5 opacity-70 hover:opacity-100 hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            <div className="flex flex-col gap-3 py-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed break-words",
                    message.role === "bot"
                      ? "bg-secondary text-foreground self-start"
                      : "bg-foreground text-background self-end"
                  )}
                >
                  {message.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 border-t border-border">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a question..."
              aria-label="Type a question"
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim()} aria-label="Send">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
