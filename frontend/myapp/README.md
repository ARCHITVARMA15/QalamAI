This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Backend API Integration Status

This frontend connects to the FastAPI backend running on `http://localhost:8000`. Below is the current status of the frontend-to-backend API integration.

### ✅ Connected Endpoints (Working)

These endpoints are fully connected to the frontend and are communicating with the actual backend.

- **Upload Document**
  - **Endpoint:** `POST /api/projects/{project_id}/scripts/upload`
  - **File:** `src/lib/api.ts` -> `uploadFile()`
  - **Status:** Connected. Sends PDF/Word/TXT files via FormData to extract text.
- **Autosave Script**
  - **Endpoint:** `PUT /api/scripts/{script_id}`
  - **File:** `src/lib/api.ts` -> `saveProject()`
  - **Status:** Connected. Autosaves the editor content to the database.
- **Story Bible (Knowledge Graph)**
  - **Endpoint:** `GET /api/scripts/{script_id}/story_bible`
  - **File:** `src/lib/knowledgeGraph.ts` -> `fetchKnowledgeGraph()`
  - **Status:** Connected. Retrieves the nodes and relationships for D3.js visualization.
- **Character Personas**
  - **Endpoint:** `POST /api/scripts/{script_id}/personas`
  - **File:** `src/lib/insightApi.ts` -> `fetchPersonas()`
  - **Status:** Connected. Extracts character traits from text. *(Note: Backend route structure needs to match this).*

### ❌ Missing Backend Endpoints (TODO)

These frontend features currently rely on mock delays in `src/lib/api.ts` because the backend routes do not exist yet in `backend/routers/analysis.py`. **The backend team needs to implement these.**

- **Paragraph Enhancement**
  - **Missing Endpoint:** `POST /api/enhance`
  - **Action:** `enhance`
  - **Requirement:** Needs to take selected text and return improved text along with `reason_tags` explaining changes.
- **Style/Tone Transformation**
  - **Missing Endpoint:** `POST /api/transform-style`
  - **Action:** `tone`
  - **Requirement:** Takes text and a `tone` parameter (e.g., "formal", "casual") and returns rewritten text mimicking that style using local T5-small.
- **Writing Assistance (Describe, Brainstorm, Write, Rewrite)**
  - **Missing Endpoint:** `POST /api/ai/action` (or individual endpoints for each action)
  - **Requirement:** Various NLP tasks that assist the writer with generating ideas, expanding descriptions, or restructuring syntax.
- **AI Chat Assistant**
  - **Missing Endpoint:** `POST /api/chat`
  - **Requirement:** A conversational endpoint to discuss the story with the AI based on the current context and story bible.
