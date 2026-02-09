// Request validation middleware

export const validateUserId = (req, res, next) => {
  const userId = req.query.userId || req.body.userId;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }
  req.userId = userId.trim();
  next();
};

export const validateChatRequest = (req, res, next) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message required" });
  }
  next();
};

export const validateImageGenerationRequest = (req, res, next) => {
  const prompt = req.body.prompt?.trim();
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }
  next();
};
