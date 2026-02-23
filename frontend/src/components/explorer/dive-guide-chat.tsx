"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function DiveGuideChat() {
  const t = useTranslations("explorerPage");
  const tCommon = useTranslations("common");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = async () => {
    setHasStarted(true);
    setIsLoading(true);

    try {
      const response = await fetch("/api/explorer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });

      const data = await response.json();

      if (data.message) {
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.message,
          },
        ]);
      } else if (data.error) {
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.error,
          },
        ]);
      }
    } catch {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: tCommon("error"),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) {return;}

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/explorer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.message,
          },
        ]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.error,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: tCommon("error"),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setHasStarted(false);
  };

  if (!hasStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/30"
        >
          <Bot className="h-12 w-12 text-white" aria-hidden />
        </motion.div>

        <h2 className="mb-3 text-2xl font-bold text-white">{t("chatTitle")}</h2>

        <p className="mb-8 max-w-md text-white/70">{t("chatIntro")}</p>

        <button
          type="button"
          onClick={startConversation}
          disabled={isLoading}
          className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-6 text-lg font-medium text-white shadow-lg shadow-cyan-500/30 transition-shadow hover:from-cyan-600 hover:to-blue-700 hover:shadow-cyan-500/50 disabled:opacity-70"
        >
          {t("startChat")}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
            <Bot className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t("chatTitle")}</h3>
            <p className="text-xs text-white/50">{t("chatSubtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetConversation}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t("reset")}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  message.role === "assistant"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                    : "bg-white/20"
                }`}
              >
                {message.role === "assistant" ? (
                  <Bot className="h-4 w-4 text-white" aria-hidden />
                ) : (
                  <User className="h-4 w-4 text-white" aria-hidden />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "assistant"
                    ? "bg-white/10 text-white"
                    : "bg-cyan-500/20 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
              <Bot className="h-4 w-4 text-white" aria-hidden />
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2
                  className="h-4 w-4 animate-spin text-cyan-400"
                  aria-hidden
                />
                <span className="text-sm text-white/50">{tCommon("loading")}</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("inputPlaceholder")}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-white transition-opacity hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
