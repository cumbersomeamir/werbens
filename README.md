# Werbens

Create content for your business or product — totally autonomously.

## Structure

- **frontend/** — Next.js 15.5.9 app with Tailwind CSS
- **backend/** — Express.js API server

## Color Scheme

| Name          | Hex     | Usage         |
|---------------|---------|---------------|
| Light Cyan    | #7FE7DC | Backgrounds   |
| Dark Cyan     | #316879 | Primary/accents |
| Text          | #000000 | Body text     |
| Alternate Text| #FFFFFF | Text on dark  |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# Install root dependencies (concurrently)
npm install

# Install frontend & backend dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Run both frontend and backend with a single command
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080

### Run Individually

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```
