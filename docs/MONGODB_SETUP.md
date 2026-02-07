# MongoDB Setup

## Local

1. [Install MongoDB](https://www.mongodb.com/docs/manual/installation/) or use Docker:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. Backend `.env` (default):
   ```
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=werbens
   ```

## Atlas (cloud)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/`)
3. In `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/werbens?retryWrites=true&w=majority
   MONGODB_DB=werbens
   ```

## Onboarding collection

Documents are inserted on onboarding completion. Schema includes `userId`, `username`, `platforms`, `business`, `goals`, `completedAt`, `updatedAt`.
