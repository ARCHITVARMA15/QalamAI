## Problem Statement — Detailed Description

The challenge is to build an **AI-powered writing assistant** designed for scripts, screenplays, and long-form content. The core problem it must solve is threefold.

**First, narrative drift.** When writers work on long documents — 50 to 200+ pages — they inevitably introduce contradictions. A character's eye color changes. A timeline breaks. A relationship established in Scene 5 is contradicted in Scene 60. No existing free tool catches this automatically. The system must track every fact, character trait, and story event and alert the writer the moment something conflicts with what was already established.

**Second, unguided improvement.** Most AI writing tools return a "better" version of your text with no explanation. That is a black box. This PS specifically demands that every enhancement be explainable — the writer must see exactly what changed (word, sentence, paragraph level) and exactly why (passive voice, pacing issue, readability, continuity error). This builds trust and makes the tool educational, not just automated.

**Third, style control without chaos.** Writers need to shift tone — formal to casual, modern to historical, terse to elaborate — but in a controlled, reversible way. The system must allow granular control over how much transformation is applied, not just a binary "rewrite it" button.

The PS also carries a strict constraint:  **the core logic must be custom-engineered** . Solutions that just pass text to an LLM and return the response will be disqualified. Judges expect real NLP pipelines, custom algorithms, and documented system design. LLMs may be used minimally for specific subtasks like syntax rewriting, but must be clearly disclosed.

---

## Detailed Solution

## System Architecture Philosophy

Our solution is built on three interconnected pillars: a **Knowledge Graph Engine** that understands the story, a **Multi-Layer NLP Pipeline** that analyzes and improves text, and a **Transparent UI** that shows every decision with full reasoning.

## Core Engine — Knowledge Graph + Story Bible

As a user writes or uploads a script, the system runs a custom spaCy-based NLP pipeline to automatically extract all named entities (characters, locations, dates, events) and their attributes. These are stored in a **NetworkX knowledge graph** — a living document called the Story Bible. Nodes represent characters and places; edges represent relationships (with type, strength, and source scene). Every new sentence is cross-referenced against this graph before any suggestion is made. This means the system  *understands the story* , not just the text.

## Contradiction Detection Engine

Using the Story Bible as ground truth, every incoming sentence is parsed for facts, traits, and temporal markers. A custom rule-based logic system (not LLM) checks for conflicts using TF-IDF semantic similarity + constraint validation. If a sentence contradicts an established fact, a real-time flag appears with the exact conflicting line, a reason label, and a clickable jump link to the source. Detection covers character trait violations, timeline paradoxes, spatial impossibilities, and relationship contradictions.

## Style & Tone Transformation

A two-layer system handles style. Layer 1 is entirely rule-based — vocabulary substitution dictionaries, dependency-tree manipulation for active/passive conversion, and contraction handling. Layer 2 uses an external API (like Groq) for complex syntax restructuring. The transformation is controlled via an intensity slider (1–10), so users choose how aggressively the style shifts. A separate "Style Fingerprint" system lets users upload past work, extract their personal writing signature (sentence length distribution, lexical diversity, POS patterns), and apply it to new content.

## Explainability Layer

Every suggestion surfaces in a **side-by-side diff viewer** with tagged reasons per change — `[PASSIVE VOICE]`, `[CONTINUITY ERROR]`, `[PRONOUN AMBIGUITY]`, `[PACING ISSUE]`, etc. Users can click any entity reference in the diff to jump directly to its first occurrence in the document. Nothing is hidden, nothing is guessed — every output is traceable to a rule or a data point in the Story Bible.

## Collaboration Layer

A real-time collaborative editor (WebSocket + Yjs CRDT) lets multiple writers co-edit simultaneously — treating scripts like code projects. Version history, branching for alternate endings, and merge review workflows are all supported. Think GitHub, but for storytelling.

## Analytics Dashboard

A visual pacing panel shows word density per scene, dialogue vs. description ratios, sentiment curve across the narrative arc, and a colour-coded heatmap of the full document (green = clean, red = multiple issues). This gives writers a strategic view of their entire script at a glance.

## Tech Stack

* **Backend:** FastAPI, spaCy, NetworkX, MongoDB, WebSocket
* **Frontend:** React + Tailwind CSS, D3.js (graph), CodeMirror (editor), Recharts (analytics)
* **LLM Policy:** Custom pipelines with minimal external API calls — fully documented

---

## Features — Names & Short Descriptions

**1. Knowledge Graph + Story Bible**
Auto-extracts characters, relationships, locations, and timeline from any script and builds a visual, interactive knowledge graph that updates as you write.

**2. Contradiction & Continuity Detector**
Flags logic errors in real time — character trait violations, timeline breaks, relationship conflicts — with a direct clickable link to the original conflicting line.

**3. Explainable Diff Viewer**
Side-by-side before/after view of every enhancement, with reason tags on every change showing exactly what was fixed and why.

**4. Tone & Era Style Transformer**
Shift writing style (modern ↔ Victorian, formal ↔ casual) with an intensity slider that controls how deeply the transformation is applied — word-swap only at low intensity, full syntax rewrite at high intensity.

**5. Personal Style Fingerprinting**
Upload your past scripts or articles; the system learns your unique writing voice and helps new content match it, or alerts you when co-writers deviate from your established style.

**6. Collaborative GitHub-Style Workspace**
Real-time multi-writer co-editing with version history, branching for alternate story directions, and a merge/review workflow — treating scripts like code projects.

**7. Reference Map (Click-to-Navigate)**
Every entity mention in the document is linked. Click a character's name in any suggestion and jump instantly to every scene they appear in.

**8. Scene Pacing Analyzer & Heatmap**
Visual dashboard showing word density, dialogue vs. description ratio, emotional intensity curve, and a full-document colour heatmap highlighting problem zones by issue density.

**9. Real-Time Grammar & Style Feedback**
Grammarly-style live underlines as you type — red for grammar errors, yellow for style issues, blue for story consistency warnings — with 300ms debounce for smooth performance.

**10. Multilingual Support**
Native support for English, Hindi, and Marathi — NLP pipelines and consistency checks work across languages, targeting India's regional and mainstream film industry.

**11. Image Context Panels**
Upload reference photos (character art, location images, mood boards) that auto-display in the sidebar when you write a scene involving that character or place.

**12. Auto Video Trailer & Comic Preview**
Extracts key dramatic beats from the script and generates a comic-panel storyboard or short video trailer using local Stable Diffusion — a visual pitch deck built instantly from your writing.



## Database & API Integration Guide (Frontend)

To build out the UI, the frontend will communicate with the FastAPI backend through a structured RESTful API. The data is persisted in a MongoDB database with the following collections and corresponding endpoints.

### Collections Overview

- **`users`**: Stores writer accounts, preferences, and authentication details.
- **`projects`**: Top-level workspaces for a film, show, or book. Linked to an owner (`user_id`).
- **`scripts`**: The actual documents/scenes being written. Linked to a `project_id`.
- **`story_bibles`**: Knowledge graph states extracted from the scripts.
- **`contradictions`**: Detected continuity errors and logic breaks.
- **`enhancements`**: AI-suggested rewrites (e.g., active voice, pacing improvements).
- **`style_fingerprints`**: The writer's extracted personal style profile.

### API Endpoint Map

Below is the planned RESTful API structure for frontend integration.

#### 1. User & Authentication (`routers/users.py`)

- `POST /api/users/register` - Create a new account.
- `POST /api/users/login` - Authenticate and receive a token.
- `GET /api/users/me` - Get current user profile and preferences.

#### 2. Projects & Scripts (`routers/scripts.py`)

- `POST /api/projects` - Create a new project.
- `GET /api/projects` - List all projects for the logged-in user.
- `POST /api/projects/{project_id}/scripts` - Create a new script in a project.
- `POST /api/projects/{project_id}/scripts/upload` - Upload a document (PDF/Word/TXT), extract clean text, auto-split anthologies, and save to database.
- `GET /api/projects/{project_id}/scripts` - List all scripts in a project.
- `GET /api/scripts/{script_id}` - Load the script into the editor.
- `PUT /api/scripts/{script_id}` - Autosave the script content.

#### 3. Core AI Engine & Enhancements (`routers/analysis.py`)

- `POST /api/scripts/{script_id}/analyze` - Run full NLP pipeline (Extracts entities -> Updates Story Bible -> Flags Contradictions -> Suggests Enhancements).
- `GET /api/scripts/{script_id}/story_bible` - Retrieve the knowledge graph data for the D3.js UI.
- `GET /api/scripts/{script_id}/contradictions` - Fetch unresolved logic errors.
- `PUT /api/contradictions/{contra_id}/resolve` - Mark an error as resolved.
- `GET /api/scripts/{script_id}/enhancements` - Fetch pending AI suggestions for the Diff Viewer.
- `PUT /api/enhancements/{enhance_id}/accept` - Accept or reject a suggestion.

#### 4. Collaboration

- `WS /ws/collab/{script_id}` - WebSocket connection for Yjs CRDT real-time multi-player editing.
