/**
 * Custom hook for chat functionality
 */
import { useState, useCallback } from "react";
import { generateChatResponse } from "../api/services/chatService.js";

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async ({ message, system }) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateChatResponse({ message, system });
      return result;
    } catch (err) {
      const errorMessage = err.message || "Chat failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
  };
}
