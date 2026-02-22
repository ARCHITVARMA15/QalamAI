"""
flow.py — Central AI Orchestration Engine for Kalam.

This is the "brain" that coordinates all AI pipelines. Instead of each router
calling services directly, they call flow functions which handle the full
pipeline sequencing, error handling, and response formatting.

Three main orchestrations:
1. orchestrate_analysis  — KG build → contradiction detection → auto-suggestions
2. orchestrate_comic_strip — split text into scene chunks → generate multiple images
3. generate_comic_pdf — take base64 images → produce a downloadable PDF

All orchestrations are async and return structured dicts matching frontend interfaces.
"""

import io
import base64
import asyncio
import logging
from typing import Optional

from config.db import get_database
from config.db_helpers import insert_document
from services.knowledge_graph import KnowledgeGraphEngine
from services.contradiction_detector import ContradictionDetector
from ai.writing_tools import ai_auto_suggest
from ai.media_generator import generate_comic_image

logger = logging.getLogger(__name__)

# ── Singleton NLP engines (loaded once, reused across requests) ──────────────
try:
    _kg_engine = KnowledgeGraphEngine()
    _detector = ContradictionDetector()
except Exception as e:
    logger.error(f"Failed to initialize NLP engines in flow.py: {e}")
    _kg_engine = None
    _detector = None


# ═════════════════════════════════════════════════════════════════════════════
# 1. Full Analysis Orchestration
#    KG build/merge → contradiction detection → auto-suggestions
#    Called once after the user's first AI interaction on a script.
# ═════════════════════════════════════════════════════════════════════════════

async def orchestrate_analysis(
    script_id: str,
    text: str,
    run_suggestions: bool = True,
    user_message: str = "",
) -> dict:
    """
    Runs the full analysis pipeline in sequence:
    1. Fetch existing story bible from DB
    2. Run contradiction detector against existing KG
    3. Rebuild/merge knowledge graph with new text
    4. Save merged KG and new contradictions to DB
    5. Optionally run auto-suggest for proactive continuity tips

    Returns:
        {
            "issues": [{ sentence, conflict_with, reason_tag, _id }],
            "suggestions": ["suggestion 1", ...],
            "kg_stats": { "nodes": int, "links": int },
            "contradictions_found": int,
        }
    """
    if not _kg_engine or not _detector:
        return {
            "issues": [],
            "suggestions": [],
            "kg_stats": {"nodes": 0, "links": 0},
            "contradictions_found": 0,
            "error": "NLP engines not initialized",
        }

    db = get_database()

    # ── Step 1: Fetch existing story bible ───────────────────────────────────
    existing_bible = await db["story_bibles"].find_one({"script_id": script_id})
    existing_nodes = existing_bible.get("nodes", []) if existing_bible else []
    existing_links = existing_bible.get("links", []) if existing_bible else []

    # ── Step 2: Contradiction detection against existing KG ──────────────────
    flags = _detector.check_sentence(
        text,
        existing_nodes=existing_nodes,
        existing_links=existing_links,
    )

    # ── Step 3: Knowledge graph extraction from new text ─────────────────────
    graph_data = _kg_engine.process_text(text, scene_id="current_scene")

    # ── Step 4: Merge new graph data into existing KG ────────────────────────
    existing_nodes_dict = {n["id"]: n for n in existing_nodes}

    for new_node in graph_data.get("nodes", []):
        node_id = new_node["id"]
        if node_id in existing_nodes_dict:
            # Merge mentions, preserving existing data
            old_mentions = set(existing_nodes_dict[node_id].get("mentions", []))
            new_mentions = set(new_node.get("mentions", []))
            existing_nodes_dict[node_id]["mentions"] = list(old_mentions | new_mentions)
            existing_nodes_dict[node_id]["count"] = new_node.get("count", 1)
        else:
            existing_nodes_dict[node_id] = new_node

    merged_nodes = list(existing_nodes_dict.values())

    # Merge links — deduplicate by (source, target, relation) signature
    merged_links = list(existing_links)
    existing_sigs = {
        (l["source"], l["target"], l.get("relation", ""))
        for l in existing_links
    }
    for new_link in graph_data.get("links", []):
        sig = (new_link["source"], new_link["target"], new_link.get("relation", ""))
        if sig not in existing_sigs:
            merged_links.append(new_link)
            existing_sigs.add(sig)

    # ── Step 5: Persist merged story bible ───────────────────────────────────
    await db["story_bibles"].update_one(
        {"script_id": script_id},
        {"$set": {
            "script_id": script_id,
            "nodes": merged_nodes,
            "links": merged_links,
        }},
        upsert=True,
    )

    # ── Step 6: Persist contradictions to DB ─────────────────────────────────
    saved_issues = []
    for flag in flags:
        new_contra = {
            "script_id": script_id,
            "sentence": flag.get("conflicting_sentence"),
            "conflict_with": flag.get("reason_detail"),
            "reason_tag": flag.get("reason_tag"),
            "resolved": False,
        }
        contra_id = await insert_document("contradictions", new_contra)
        saved_issues.append({
            "_id": contra_id,
            "sentence": new_contra["sentence"],
            "conflict_with": new_contra["conflict_with"],
            "reason_tag": new_contra["reason_tag"],
        })

    # ── Step 7: Auto-suggestions (proactive continuity tips) ─────────────────
    suggestions = []
    if run_suggestions and text.strip():
        # Build a summary of the story bible for the suggestion engine
        node_lines = [
            f"- {n.get('type', 'Entity')}: {n['id']}"
            for n in merged_nodes[:40]
        ]
        link_lines = [
            f"- {l['source']} [{l.get('relation', 'related to')}] {l['target']}"
            for l in merged_links[:60]
        ]
        story_bible_summary = ""
        if node_lines:
            story_bible_summary += "Entities:\n" + "\n".join(node_lines) + "\n"
        if link_lines:
            story_bible_summary += "Relationships:\n" + "\n".join(link_lines)

        try:
            suggest_result = await ai_auto_suggest(
                recent_text=text[-2500:],
                story_bible_summary=story_bible_summary,
                user_intent=user_message,
            )
            suggestions = suggest_result.get("suggestions", [])
        except Exception as e:
            logger.warning(f"Auto-suggest failed (non-fatal): {e}")

    return {
        "issues": saved_issues,
        "suggestions": suggestions,
        "kg_stats": {"nodes": len(merged_nodes), "links": len(merged_links)},
        "contradictions_found": len(saved_issues),
    }


# ═════════════════════════════════════════════════════════════════════════════
# 2. Comic Strip Orchestration
#    Split text into scene chunks → generate an image per chunk → return all
# ═════════════════════════════════════════════════════════════════════════════

def _split_into_scenes(text: str, max_scenes: int = 6) -> list[str]:
    """
    Split selected text into logical scene chunks for multi-panel comic generation.

    Strategy (in priority order):
    1. Split on double newlines (paragraph breaks) — most natural scene division
    2. If only 1 chunk, split on single newlines
    3. If still 1 chunk, split on sentence boundaries (period + space)
    4. Cap at max_scenes to avoid excessive API calls

    Each chunk is stripped and non-empty.
    """
    # Try double-newline splits first (paragraph-level)
    chunks = [c.strip() for c in text.split("\n\n") if c.strip()]

    # Fallback: single newline splits
    if len(chunks) <= 1:
        chunks = [c.strip() for c in text.split("\n") if c.strip()]

    # Fallback: sentence-level splits
    if len(chunks) <= 1 and len(text) > 200:
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        # Group sentences into chunks of ~2–3 sentences per panel
        group_size = max(1, len(sentences) // min(max_scenes, max(2, len(sentences) // 2)))
        chunks = []
        for i in range(0, len(sentences), group_size):
            chunk = " ".join(sentences[i:i + group_size]).strip()
            if chunk:
                chunks.append(chunk)

    # Cap at max_scenes and ensure minimum of 1
    return chunks[:max_scenes] if chunks else [text.strip()]


async def orchestrate_comic_strip(
    selected_text: str,
    script_id: str = "draft",
    max_panels: int = 6,
) -> dict:
    """
    Generate a multi-panel comic strip from selected text.

    Steps:
    1. Split text into scene chunks
    2. Generate one image per chunk (concurrent requests)
    3. Return all images with metadata

    Returns:
        {
            "status": "success" | "partial" | "error",
            "panels": [
                { "image_base64": str, "prompt_used": str, "source_text": str, "panel_number": int }
            ],
            "panel_count": int,
            "failed_panels": int,
        }
    """
    if not selected_text or not selected_text.strip():
        return {"status": "error", "panels": [], "panel_count": 0, "failed_panels": 0,
                "message": "No text provided"}

    scenes = _split_into_scenes(selected_text, max_scenes=max_panels)

    # Generate images concurrently (but cap concurrency to avoid rate limits)
    semaphore = asyncio.Semaphore(3)  # Max 3 concurrent image generation calls

    async def _generate_one(scene_text: str, panel_num: int) -> dict:
        async with semaphore:
            try:
                result = await generate_comic_image(scene_text)
                if result.get("status") == "success":
                    return {
                        "image_base64": result["image_base64"],
                        "prompt_used": result.get("prompt_used", ""),
                        "source_text": scene_text,
                        "panel_number": panel_num,
                        "status": "success",
                    }
                else:
                    return {
                        "image_base64": "",
                        "source_text": scene_text,
                        "panel_number": panel_num,
                        "status": "error",
                        "message": result.get("message", "Generation failed"),
                    }
            except Exception as e:
                logger.error(f"Comic panel {panel_num} failed: {e}")
                return {
                    "image_base64": "",
                    "source_text": scene_text,
                    "panel_number": panel_num,
                    "status": "error",
                    "message": str(e),
                }

    # Fire all image generations concurrently
    tasks = [_generate_one(scene, i + 1) for i, scene in enumerate(scenes)]
    results = await asyncio.gather(*tasks)

    # Separate successes and failures
    successful = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] == "error"]

    if not successful:
        return {
            "status": "error",
            "panels": [],
            "panel_count": 0,
            "failed_panels": len(failed),
            "message": "All panels failed to generate",
        }

    overall_status = "success" if not failed else "partial"

    return {
        "status": overall_status,
        "panels": sorted(results, key=lambda r: r["panel_number"]),
        "panel_count": len(successful),
        "failed_panels": len(failed),
    }


# ═════════════════════════════════════════════════════════════════════════════
# 3. Comic PDF Generation
#    Takes a list of base64 images and produces a PDF as bytes
# ═════════════════════════════════════════════════════════════════════════════

def generate_comic_pdf(panels: list[dict], title: str = "Kalam Comic Strip") -> bytes:
    """
    Convert a list of comic panels into a multi-page PDF.

    Each panel becomes one page. Uses reportlab if available,
    falls back to a minimal manual PDF if not.

    Args:
        panels: list of dicts with 'image_base64' and optional 'source_text'
        title: PDF title metadata

    Returns:
        Raw PDF bytes ready for HTTP response
    """
    try:
        return _generate_pdf_with_reportlab(panels, title)
    except ImportError:
        # reportlab not installed — use the PIL-based fallback
        return _generate_pdf_with_pil(panels, title)


def _generate_pdf_with_reportlab(panels: list[dict], title: str) -> bytes:
    """Generate PDF using reportlab (preferred — better layout control)."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Image as RLImage, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, title=title)
    styles = getSampleStyleSheet()
    story = []

    # Title page
    story.append(Paragraph(f"<b>{title}</b>", styles["Title"]))
    story.append(Spacer(1, 0.5 * inch))

    for panel in panels:
        img_b64 = panel.get("image_base64", "")
        if not img_b64:
            continue

        # Decode image to a temporary in-memory file for reportlab
        img_bytes = base64.b64decode(img_b64)
        img_buffer = io.BytesIO(img_bytes)

        # Scale image to fit page width with some margin
        page_width = A4[0] - 2 * inch
        img = RLImage(img_buffer, width=page_width, height=page_width * 0.75)
        story.append(img)

        # Caption with the source text (truncated)
        caption_text = panel.get("source_text", "")
        if caption_text:
            safe_caption = caption_text[:200] + ("…" if len(caption_text) > 200 else "")
            story.append(Spacer(1, 0.15 * inch))
            story.append(Paragraph(f"<i>{safe_caption}</i>", styles["BodyText"]))

        story.append(Spacer(1, 0.4 * inch))

    doc.build(story)
    return buffer.getvalue()


def _generate_pdf_with_pil(panels: list[dict], title: str) -> bytes:
    """
    Fallback PDF generation using Pillow — converts images to a multi-page PDF.
    Less control over layout but works without reportlab.
    """
    from PIL import Image as PILImage

    pil_images = []
    for panel in panels:
        img_b64 = panel.get("image_base64", "")
        if not img_b64:
            continue
        img_bytes = base64.b64decode(img_b64)
        img = PILImage.open(io.BytesIO(img_bytes)).convert("RGB")
        pil_images.append(img)

    if not pil_images:
        # Return a minimal empty PDF
        return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n109\n%%EOF"

    buffer = io.BytesIO()
    # Save as multi-page PDF via Pillow
    first, *rest = pil_images
    first.save(buffer, format="PDF", save_all=True, append_images=rest)
    return buffer.getvalue()
