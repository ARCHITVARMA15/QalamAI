# ✍️ Kalam – AI Screenwriting Platform

Kalam is an **AI-powered storytelling and media generation platform** that ensures **story consistency, detects contradictions, and generates multimedia content** using knowledge graphs and LLMs.

---

## 🚀 Features

* 🧠 **Knowledge Graph Engine** – Extracts entities and relationships from scripts
* ⚠️ **Contradiction Detection** – Identifies inconsistencies in storylines
* 🤖 **AI Story Suggestions** – Context-aware narrative generation
* 🔍 **Vector Search (ChromaDB)** – Semantic similarity for story context
* 🎨 **Comic & Media Generation** – Generate visual story panels
* 📄 **PDF Export** – Export generated stories as structured documents
* 🌐 **Interactive Graph Visualization** – Explore story relationships visually

---

## 🏗️ Tech Stack

**Backend:**

* FastAPI (Python)
* MongoDB (Motor)
* Async APIs & WebSockets

**AI / ML:**

* spaCy (NER)
* NetworkX (Knowledge Graphs)
* HuggingFace Transformers
* ChromaDB (Vector DB)
* LlamaIndex
* Ollama (LLMs)
* ONNX (Model inference)

**Frontend:**

* Next.js
* React 19
* TypeScript
* Tailwind CSS
* Three.js + D3.js (Graph visualization)

---

## 🧠 How It Works

1. User inputs a script or story
2. NLP pipeline extracts entities and builds a knowledge graph
3. System checks for contradictions in new content
4. LLM generates context-aware suggestions
5. Optional: Generate images or export story as PDF

---

## 📦 Setup Instructions

```bash
# Clone repository
git clone <your-repo-link>

# Backend setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend setup
cd frontend
npm install
npm run dev
```

---

## 🌟 Future Improvements

* Real-time collaborative writing
* Advanced story reasoning using Graph AI
* Improved media generation pipelines
* Fine-tuned custom LLM models

---

## 👨‍💻 Author

Archit Varma
