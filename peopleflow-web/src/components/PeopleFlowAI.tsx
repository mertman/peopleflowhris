import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

const PeopleFlowAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am PeopleFlow AI. How can I help you manage your HR operations today?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const suggestions = [
    "Add employee",
    "Show contractors",
    "Create promotion",
    "Find birthdays"
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Append user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI thinking
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: "Coming in Sprint 4.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend(input);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 focus:outline-none"
        aria-label="Toggle PeopleFlow AI"
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-in spin-in-90 duration-200" />
        ) : (
          <div className="relative">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-indigo-600" />
          </div>
        )}
      </button>

      {/* Copilot Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[380px] h-[550px] max-h-[80vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 fade-in-50 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  PeopleFlow AI
                </h3>
                <p className="text-[10px] text-purple-100 font-medium">How can I help?</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
            {messages.map((msg) => {
              const isAI = msg.sender === "ai";
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isAI ? "justify-start" : "justify-end"}`}>
                  {isAI && (
                    <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                      <Bot className="w-4.5. h-4.5" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                    isAI 
                      ? "bg-white text-slate-800 border border-slate-100 rounded-tl-none" 
                      : "bg-purple-600 text-white rounded-tr-none"
                  }`}>
                    <p>{msg.text}</p>
                    <span className={`block text-[9px] mt-1 text-right ${
                      isAI ? "text-slate-400" : "text-purple-200"
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!isAI && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick Suggestions (only visible if there is only the welcome message) */}
            {messages.length === 1 && !isTyping && (
              <div className="pt-2 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Suggested Prompts</p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(sug)}
                      className="text-left p-2.5 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-slate-700 hover:text-purple-700 rounded-xl text-[11px] font-semibold transition-all duration-200 shadow-sm cursor-pointer"
                    >
                      &gt; {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Thinking Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce duration-600" />
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce duration-600 delay-100" />
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce duration-600 delay-200" />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask PeopleFlow AI..."
              className="flex-1 px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs border border-slate-200 focus:border-purple-400 rounded-xl outline-none transition-colors"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:hover:bg-purple-600 transition-all duration-150 cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};

export default PeopleFlowAI;
