# Kalam Project - AI Agent Instructions

## 🚨 CRITICAL WORKFLOW RULES - MANDATORY COMPLIANCE

### RULE 1: CODE DOCUMENTATION (REQUIRED)

* **ALWAYS** write concise, meaningful comments in code
* Comments must explain **WHY**, not just **WHAT**
* No verbose explanations - keep comments brief and purposeful
* **NO EXCEPTIONS** - all code must include comments

### RULE 2: TRANSPARENCY (REQUIRED)

* **EXPLAIN EVERY CHANGE** you make before and after implementing it
* Never make silent modifications to the codebase
* State clearly: "I am doing X because Y"
* After changes: "I have completed X, here's what changed..."
* **NO EXCEPTIONS** - user must understand all actions

### RULE 3: USER APPROVAL (REQUIRED - HARD STOP)

* **ASK BEFORE DECIDING** on:
  * Project structure changes
  * Technology stack choices
  * Implementation approaches
  * Library/dependency additions
  * Architecture patterns
  * File organization
* **WAIT FOR EXPLICIT APPROVAL** before proceeding
* **NO ASSUMPTIONS** about what the user wants
* **NO EXCEPTIONS** - user has final say on all decisions

### RULE 4: INCREMENTAL PROGRESS (REQUIRED - HARD STOP)

* **ONE TASK AT A TIME** - complete one thing fully before moving forward
* After completing each task:
  1. Explain what was done
  2. Show the result
  3. **STOP and ASK**: "Should I proceed with [next step], or would you like to review/modify this first?"
* **NEVER** assume the user wants you to continue to the next step
* **NEVER** chain multiple tasks together without approval
* **NO EXCEPTIONS** - user controls the pace

### RULE 5: USER EXECUTES COMMANDS (REQUIRED)

* **NEVER** assume commands have been run
* **ALWAYS** provide terminal commands for the user to execute
* Format: "Please run: `command here`"
* Wait for user to confirm results before proceeding
* User handles ALL testing and command execution
* **NO EXCEPTIONS** - agent provides instructions, user executes

### RULE 6: NO MARKDOWN FILES (REQUIRED)

* **NEVER** create .md files for explanations, documentation, or instructions
* **ALL** communication happens directly in chat
* Explanations, updates, and instructions go in chat messages only
* **NO EXCEPTIONS** - no README updates, no doc files, no markdown artifacts for explanation purposes

### RULE 7: RESUME PROJECT CONTROL (REQUIRED)

* This is a **RESUME PROJECT** - the developer (user) is learning and building their portfolio
* User must understand every decision and implementation
* Agent is a **guide and implementer**, not an autonomous builder
* **NO EXCEPTIONS** - user's learning and control are paramount

---

## Project Overview

Kalam - AI-Powered Script & Content Enhancement System

An intelligent writing assistant for screenwriters and long-form content creators. Kalam tracks narrative consistency across large documents, suggests structure and clarity improvements, applies controlled tone/style transformations, and surfaces every change with a transparent explanation — all built on custom NLP pipelines with minimal LLM dependency.

---

## Architecture (Quick Reference)

- **Backend** (`backend/`): FastAPI application with modular NLP services
- **Frontend** (`frontend/`): React 18 + TypeScript + Vite + Tailwind CSS
- **Knowledge Graph Engine** (`services/knowledge_graph.py`): spaCy NER + NetworkX story bible
- **Contradiction Detector** (`services/contradiction_detector.py`): Rule-based consistency checker
- **Style Transformer** (`services/style_transformer.py`): Rule-based + local T5-small style transfer
- **NLP Pipeline** (`services/nlp_pipeline.py`): Readability, pacing, grammar analysis
- **Collaboration Layer** (`services/collab_manager.py`): WebSocket + Yjs CRDT real-time editing
- **Multilingual Support** (`services/multilingual.py`): Hindi/Marathi NLP processing
- **Media Generator** (`services/media_generator.py`): Local Stable Diffusion for trailer/comic generation
- **Database** (`config/db.py`): MongoDB connection management
- **Config** (`config/settings.py`): Environment-based configuration with python-dotenv

---

### Service Design Rules

- Each service must be independent and individually testable
- Use dependency injection for external clients (T5-small, LanguageTool)
- Implement fallback mechanisms for model failures (rule-based always runs)
- Keep any API keys in environment variables, never hardcode
- Core logic (NER, graph, contradiction rules) must never call external APIs

---

## Quick Reference

### Key Files

- `main.py` — FastAPI routes and application entry point
- `settings.py` — Environment configuration
- `knowledge_graph.py` — spaCy NER + NetworkX story bible construction
- `contradiction_detector.py` — Rule-based consistency and logic checker
- `style_transformer.py` — Vocabulary rules + local T5-small style transfer
- `nlp_pipeline.py` — Readability, pacing, grammar, coreference analysis
- `collab_manager.py` — WebSocket real-time collaboration manager
- `App.tsx` — Main React editor component

### Backend Services Layer

| Service               | File                          | Purpose                                        |
| --------------------- | ----------------------------- | ---------------------------------------------- |
| KnowledgeGraphEngine  | `knowledge_graph.py`        | spaCy NER + NetworkX story bible               |
| ContradictionDetector | `contradiction_detector.py` | Rule-based fact conflict detection             |
| StyleTransformer      | `style_transformer.py`      | Rule-based vocab swap + local T5-small rewrite |
| NLPPipeline           | `nlp_pipeline.py`           | Readability, pacing, grammar, coreference      |
| CollabManager         | `collab_manager.py`         | WebSocket + CRDT real-time co-editing          |
| MultilingualProcessor | `multilingual.py`           | Cross-language NLP (English, Hindi, Marathi)   |
| MediaGenerator        | `media_generator.py`        | Stable diffusion for comic/video storyboard    |

### API Endpoints

| Method    | Endpoint                | Description                                          |
| --------- | ----------------------- | ---------------------------------------------------- |
| GET       | `/`                   | Health check                                         |
| POST      | `/analyze`            | Full script analysis → story bible + enhancements   |
| POST      | `/enhance`            | Paragraph-level enhancement with reason tags         |
| POST      | `/transform-style`    | Apply tone/era transformation with intensity control |
| POST      | `/fingerprint`        | Upload past work → build personal style profile     |
| POST      | `/check-continuity`   | Check sentence against existing story bible          |
| WebSocket | `/ws/collab/{doc_id}` | Real-time collaborative editing channel              |

### Frontend Components

| Component       | File                    | Purpose                                        |
| --------------- | ----------------------- | ---------------------------------------------- |
| App             | `App.tsx`             | Main editor layout, routing, state             |
| ScriptEditor    | `ScriptEditor.tsx`    | CodeMirror-based collaborative writing editor  |
| KnowledgeGraph  | `KnowledgeGraph.tsx`  | D3.js interactive character/relationship graph |
| DiffViewer      | `DiffViewer.tsx`      | Side-by-side diff with reason tags             |
| PacingDashboard | `PacingDashboard.tsx` | Recharts pacing + sentiment analytics          |
| StyleControls   | `StyleControls.tsx`   | Tone/era sliders and intensity controls        |
| StoryBiblePanel | `StoryBiblePanel.tsx` | Sidebar showing extracted story bible          |

### LLM Usage Policy (Strict)

| Component                    | Approach             | LLM Used?           |
| ---------------------------- | -------------------- | ------------------- |
| NER + entity extraction      | spaCy                | ❌ No               |
| Knowledge graph construction | NetworkX             | ❌ No               |
| Contradiction detection      | Rule-based logic     | ❌ No               |
| Readability + pacing         | Custom metrics       | ❌ No               |
| Grammar checking             | LanguageTool (local) | ❌ No               |
| Coreference resolution       | spaCy neuralcoref    | ❌ No               |
| Vocabulary-level style swap  | Dictionary rules     | ❌ No               |
| Syntax-level style rewrite   | T5-small (local)     | ✅ Yes (documented) |

**Total: ~80% custom pipelines, ~20% local T5-small. Zero cloud LLM API calls in core logic.**

### Anti-Patterns

- ❌ Calling external LLM APIs for core NLP logic → ✅ Use spaCy + rule-based pipelines
- ❌ Generic exception catching → ✅ Specific exceptions with context
- ❌ No fallback when T5-small fails → ✅ Rule-based transform always available as fallback
- ❌ Blocking synchronous NLP calls → ✅ Use async + background tasks for heavy processing
- ❌ Missing CORS configuration → ✅ Configure allowed origins in settings
- ❌ Hardcode model paths → ✅ Load from `.env` via settings
- ❌ Returning raw model output without reason tags → ✅ Always attach reason_tag + reason_detail
