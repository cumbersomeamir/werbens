"use client";

import { useState, useRef } from "react";

function ImageIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

export function CreateChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageAttach = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith("image/"));
    setImages((prev) => [...prev, ...valid].slice(0, 4)); // max 4 images
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    const text = input.trim();
    if (!text && images.length === 0) return;

    const imageUrls = images.map((f) => URL.createObjectURL(f));
    const userContent = { type: "user", text, imageUrls };
    setMessages((prev) => [...prev, userContent]);
    setInput("");
    setImages([]);
    setIsGenerating(true);

    // Scroll to show new message
    setTimeout(scrollToBottom, 50);

    // Placeholder: simulate generation (replace with real API call)
    await new Promise((r) => setTimeout(r, 1200));

    setMessages((prev) => [
      ...prev,
      {
        type: "assistant",
        text: "Generated content will appear here. Connect your API to enable real content generation.",
      },
    ]);
    setIsGenerating(false);
    setTimeout(scrollToBottom, 50);
  };

  const canSend = (input.trim() || images.length > 0) && !isGenerating;

  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto px-4 sm:px-6">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-werbens-text/60 max-w-sm">
              Type what you want to create, attach images for context, and hit
              generate.
            </p>
            <p className="mt-2 text-sm text-werbens-text/50">
              e.g. &quot;Social post for our new product launch&quot;
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.type === "user"
                  ? "bg-werbens-dark-cyan text-white"
                  : "bg-werbens-light-cyan/30 border border-werbens-dark-cyan/10 text-werbens-text"
              }`}
            >
              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
              {msg.imageUrls && msg.imageUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.imageUrls.map((url, j) => (
                    <img
                      key={j}
                      src={url}
                      alt=""
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-werbens-light-cyan/30 border border-werbens-dark-cyan/10 px-4 py-3">
              <span className="inline-flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-werbens-dark-cyan animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-werbens-dark-cyan animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-werbens-dark-cyan animate-pulse" />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 pb-4 sm:pb-6">
        <div className="rounded-2xl border-2 border-werbens-dark-cyan/15 bg-white shadow-sm focus-within:border-werbens-dark-cyan/40 transition">
          {/* Attached images preview */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-b border-werbens-dark-cyan/10">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(img)}
                    alt=""
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-werbens-text text-white flex items-center justify-center text-sm hover:bg-red-500 transition touch-manipulation"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 p-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 p-2.5 rounded-lg text-werbens-text/60 hover:text-werbens-dark-cyan hover:bg-werbens-light-cyan/30 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Attach image"
            >
              <ImageIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageAttach}
            />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="What would you like to create?"
              rows={2}
              className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent px-2 py-2 text-werbens-text placeholder-werbens-text/40 focus:outline-none focus:ring-0"
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canSend}
              className="shrink-0 p-2.5 rounded-lg bg-werbens-dark-cyan text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-werbens-dark-cyan/90 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Generate"
            >
              <SendIcon />
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-werbens-text/50">
          Press Enter to generate, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
