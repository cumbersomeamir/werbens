// Error handling middleware

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // MongoDB connection errors
  const isMongoDown =
    err.name === "MongoServerSelectionError" ||
    err.name === "MongoNetworkError" ||
    err.cause?.code === "ECONNREFUSED";

  if (isMongoDown) {
    return res.status(503).json({
      error: "Database unavailable. Start MongoDB or add MONGODB_URI to .env",
      skipped: true,
    });
  }

  // Default error response
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
