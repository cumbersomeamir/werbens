"use client";

import { useState, useRef, useEffect } from "react";
import { generateChatResponse, getOrCreateSessionId } from "@/api/services/chatService.js";
import { generateImage, fileToBase64 } from "@/api/services/imageGenerationService.js";
import { classifyPrompt } from "@/api/services/modelSwitcherService.js";
import { getOrCreateSession, clearSession, getSessionMessages } from "@/api/services/sessionService.js";
import { clearSessionId } from "@/utils/storage.js";
import { ASPECT_RATIOS } from "@/constants/index.js";

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

function SparkleIcon() {
  return (
    <svg
      className="h-10 w-10 text-werbens-dark-cyan/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

export function CreateChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [detectedMode, setDetectedMode] = useState(null); // "text" or "image" - auto-detected
  const [aspectRatio, setAspectRatio] = useState("1:1"); // Default square
  const [sessionId, setSessionId] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const currentSessionId = getOrCreateSessionId();
        const { sessionId: confirmedSessionId } = await getOrCreateSession(currentSessionId);
        setSessionId(confirmedSessionId);

        // Load previous messages
        try {
          const { messages: savedMessages } = await getSessionMessages(confirmedSessionId);
          if (savedMessages && savedMessages.length > 0) {
            // Convert saved messages to UI format
            const uiMessages = savedMessages.map((msg) => {
              if (msg.contentType === "image") {
                return {
                  type: msg.type,
                  text: msg.prompt || "",
                  image: msg.imageUrl || msg.content,
                };
              }
              return {
                type: msg.type,
                text: msg.content,
              };
            });
            setMessages(uiMessages);
          }
        } catch (err) {
          console.error("Failed to load session messages:", err);
        }
      } catch (err) {
        console.error("Failed to initialize session:", err);
      } finally {
        setIsLoadingSession(false);
      }
    }
    initSession();
  }, []);

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

  const handleNewChat = async () => {
    if (!sessionId) return;

    try {
      // Clear session on backend
      await clearSession(sessionId);
      
      // Generate new session ID
      clearSessionId();
      const newSessionId = getOrCreateSessionId();
      const { sessionId: confirmedSessionId } = await getOrCreateSession(newSessionId);
      setSessionId(confirmedSessionId);
      
      // Clear UI state
      setMessages([]);
      setDetectedMode(null);
      setInput("");
      setImages([]);
    } catch (err) {
      console.error("Failed to start new chat:", err);
    }
  };

  const handleGenerate = async () => {
    const text = input.trim();
    if (!text && images.length === 0) return;
    if (!sessionId) return;

    // Store images before clearing
    const imagesToUse = [...images];
    const imageUrls = imagesToUse.map((f) => URL.createObjectURL(f));
    const userContent = { type: "user", text, imageUrls };
    setMessages((prev) => [...prev, userContent]);
    const promptText = text;
    setInput("");
    setImages([]);
    setIsGenerating(true);

    setTimeout(scrollToBottom, 50);

    try {
      // Auto-detect generation mode using model-switcher
      const detectedType = await classifyPrompt(promptText);
      const mode = detectedType.toLowerCase() === "image" ? "image" : "text";
      setDetectedMode(mode);

      if (mode === "text") {
        const data = await generateChatResponse({
          message: promptText,
          sessionId,
        });
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            text: data.message || data.text || "Generated content",
          },
        ]);
      } else {
        let referenceImageBase64 = null;
        let referenceImageMime = "image/jpeg";
        
        if (imagesToUse.length > 0) {
          const firstImage = imagesToUse[0];
          const { base64, mime } = await fileToBase64(firstImage);
          referenceImageBase64 = base64;
          referenceImageMime = mime;
        }

        const data = await generateImage({
          prompt: promptText,
          referenceImageBase64,
          referenceImageMime,
          aspectRatio,
          sessionId,
        });

        if (data.image) {
          // Display image immediately (backend will upload to S3 in background)
          setMessages((prev) => [
            ...prev,
            {
              type: "assistant",
              image: data.image,
              text: promptText,
            },
          ]);
        } else {
          throw new Error("No image in response");
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          text: `Error: ${err instanceof Error ? err.message : "Generation failed"}`,
          isError: true,
        },
      ]);
    } finally {
      setIsGenerating(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const canSend = (input.trim() || images.length > 0) && !isGenerating;

  if (isLoadingSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-werbens-muted">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto px-4 sm:px-6">
      {/* New Chat button */}
      {messages.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="px-4 py-2 rounded-xl text-sm font-medium text-werbens-dark-cyan hover:bg-werbens-light-cyan/30 border border-werbens-dark-cyan/20 transition-all duration-200"
          >
            New Chat
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 space-y-5 sm:space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center">
            <div className="stagger-1 animate-fade-in-up mb-5 p-4 rounded-2xl bg-werbens-light-cyan/20 border border-werbens-dark-cyan/10">
              <SparkleIcon />
            </div>
            <p className="stagger-2 animate-fade-in-up text-base sm:text-lg text-werbens-text/70 max-w-md leading-relaxed">
              Describe what you want to{" "}
              <span className="gradient-text font-semibold">create</span>.
              We'll automatically detect if you need text or image generation.
            </p>
            <p className="stagger-3 animate-fade-in-up mt-3 text-sm text-werbens-muted italic">
              e.g. &quot;Write a social post for our launch&quot; or &quot;Generate an image of a futuristic city&quot;
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex animate-fade-in-up ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-5 py-3.5 ${
                msg.type === "user"
                  ? "bg-gradient-to-br from-werbens-dark-cyan to-werbens-midnight text-white glow-sm"
                  : msg.isError
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                    : "glass border border-werbens-dark-cyan/10 text-werbens-text shadow-sm"
              }`}
            >
              {msg.text && (
                <p className={`whitespace-pre-wrap leading-relaxed ${msg.isError ? "font-medium" : ""}`}>{msg.text}</p>
              )}
              {msg.image && (
                <div className="mt-3">
                  <img
                    src={msg.image}
                    alt="Generated"
                    className="max-w-full rounded-xl border border-werbens-dark-cyan/10 shadow-sm"
                  />
                </div>
              )}
              {msg.imageUrls && msg.imageUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.imageUrls.map((url, j) => (
                    <img
                      key={j}
                      src={url}
                      alt=""
                      className="h-20 w-20 object-cover rounded-xl ring-1 ring-white/20"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="glass rounded-2xl border border-werbens-dark-cyan/10 px-5 py-4 shadow-sm">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full bg-werbens-dark-cyan animate-dot-pulse"
                  style={{ animationDelay: "0s" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-werbens-dark-cyan animate-dot-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-werbens-dark-cyan animate-dot-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 pb-4 sm:pb-6">
        {/* Aspect ratio selector - only show when image mode is detected */}
        {detectedMode === "image" && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xs text-werbens-muted font-medium">Aspect Ratio:</span>
            <div className="flex items-center gap-1.5 bg-werbens-mist/40 rounded-xl p-1">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  type="button"
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    aspectRatio === ratio.value
                      ? "bg-gradient-to-br from-werbens-dark-cyan to-werbens-midnight text-white shadow-sm"
                      : "text-werbens-muted hover:text-werbens-dark-cyan hover:bg-werbens-light-cyan/20"
                  }`}
                  title={ratio.label}
                >
                  <span className="mr-1.5">{ratio.icon}</span>
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="glass rounded-2xl shadow-elevated border border-werbens-dark-cyan/10 focus-within:border-werbens-dark-cyan/30 focus-within:shadow-elevated-lg transition-all duration-300">
          {/* Attached images preview */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 p-3 border-b border-werbens-dark-cyan/10">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(img)}
                    alt=""
                    className="h-18 w-18 object-cover rounded-xl ring-1 ring-werbens-dark-cyan/10 transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-werbens-text/80 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all duration-200 shadow-md touch-manipulation"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 p-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 p-2.5 rounded-xl text-werbens-muted hover:text-werbens-dark-cyan hover:bg-werbens-light-cyan/30 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
              placeholder="What would you like to create? (Text or image - we'll detect automatically)"
              rows={2}
              className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent px-3 py-2.5 text-werbens-text placeholder-werbens-muted focus:outline-none focus:ring-0 leading-relaxed"
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canSend}
              className={`shrink-0 p-2.5 rounded-xl text-white transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 ${
                canSend
                  ? "bg-gradient-to-br from-werbens-dark-cyan to-werbens-midnight glow-sm hover:shadow-lg"
                  : "bg-werbens-steel/40 cursor-not-allowed"
              }`}
              aria-label="Generate"
            >
              <SendIcon />
            </button>
          </div>
        </div>
        <p className="mt-2.5 text-xs text-werbens-muted text-center">
          Press <kbd className="px-1.5 py-0.5 rounded bg-werbens-cloud/60 text-werbens-alt-text font-medium text-[11px]">Enter</kbd> to generate, <kbd className="px-1.5 py-0.5 rounded bg-werbens-cloud/60 text-werbens-alt-text font-medium text-[11px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
