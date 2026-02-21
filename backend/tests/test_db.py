# test_db.py
# -----------------------------------------------------------------------
# PURPOSE: Tests every database operation for Kalam's collections.
# RUN WITH: python test_db.py (from inside backend/ folder)
# This file also serves as a reference — showing exactly how to use
# insert, find, update, and delete for every collection in kalam_db.
# -----------------------------------------------------------------------

import asyncio
from datetime import datetime
import sys
from pathlib import Path

# Add the parent directory (backend root) to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.db import connect_db, close_db
from config.db_helpers import (
    insert_document,
    find_by_id,
    find_many,
    update_document,
    delete_document
)


# -----------------------------------------------------------------------
# USERS — stores writer accounts
# -----------------------------------------------------------------------
async def test_users():
    print("\n👤 Testing USERS collection...")

    # Create a user — this is how you save a new account
    user_id = await insert_document("users", {
        "email": "vatsal@kalam.com",
        "username": "vatsal",
        "hashed_password": "hashed_abc123",   # always store hashed, never plain
        "preferred_language": "en",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    print(f"  ✅ User created with ID: {user_id}")

    # Fetch user by ID — this is how any route retrieves a user
    user = await find_by_id("users", user_id)
    print(f"  ✅ User fetched: {user['username']} ({user['email']})")

    # Update user — e.g. user changes their preferred language
    updated = await update_document("users", user_id, {"preferred_language": "hi"})
    print(f"  ✅ User updated (language → hi): {updated}")

    return user_id   # pass to next test so project can reference this user


# -----------------------------------------------------------------------
# PROJECTS — a writer's top-level workspace (one per film/show)
# -----------------------------------------------------------------------
async def test_projects(user_id: str):
    print("\n📁 Testing PROJECTS collection...")

    project_id = await insert_document("projects", {
        "owner_id": user_id,              # links to the user who created it
        "title": "The Silent Valley",
        "description": "A psychological thriller set in rural Maharashtra.",
        "language": "en",
        "collaborators": [],              # other user_ids can be added here
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    print(f"  ✅ Project created with ID: {project_id}")

    # Fetch all projects owned by this user — used in the dashboard
    projects = await find_many("projects", {"owner_id": user_id})
    print(f"  ✅ Projects for user: {[p['title'] for p in projects]}")

    return project_id


# -----------------------------------------------------------------------
# SCRIPTS — the actual document being written
# -----------------------------------------------------------------------
async def test_scripts(project_id: str):
    print("\n📄 Testing SCRIPTS collection...")

    script_id = await insert_document("scripts", {
        "project_id": project_id,         # links to its parent project
        "title": "Act 1 - The Arrival",
        "content": "EXT. VALLEY ROAD - DAY\nA dusty road winds through dense forest. ARJUN (30s) drives alone.",
        "version": 1,
        "word_count": 20,
        "language": "en",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    print(f"  ✅ Script created with ID: {script_id}")

    # Fetch script by ID — used when editor loads a document
    script = await find_by_id("scripts", script_id)
    print(f"  ✅ Script fetched: {script['title']}")

    # Update content — happens every autosave in the editor
    updated = await update_document("scripts", script_id, {
        "content": "EXT. VALLEY ROAD - DAY\nArjun stops the car. He stares at the fog ahead.",
        "word_count": 15
    })
    print(f"  ✅ Script content updated: {updated}")

    return script_id


# -----------------------------------------------------------------------
# STORY BIBLE — knowledge graph data persisted after analysis
# -----------------------------------------------------------------------
async def test_story_bible(script_id: str):
    print("\n📖 Testing STORY_BIBLES collection...")

    bible_id = await insert_document("story_bibles", {
        "script_id": script_id,           # one story bible per script
        "characters": {
            "Arjun": {
                "name": "Arjun",
                "aliases": ["AJ"],
                "traits": ["introverted", "30s", "drives alone"],
                "first_scene": 1,
                "relationships": {}
            }
        },
        "locations": ["Valley Road", "Dense Forest"],
        "timeline_events": [
            {"scene": 1, "event": "Arjun arrives at valley", "timestamp": "DAY"}
        ],
        "themes": ["isolation", "mystery"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    print(f"  ✅ Story Bible created with ID: {bible_id}")

    # Fetch story bible for a script — used by contradiction detector
    bibles = await find_many("story_bibles", {"script_id": script_id})
    print(f"  ✅ Story Bible fetched, characters: {list(bibles[0]['characters'].keys())}")

    return bible_id


# -----------------------------------------------------------------------
# CONTRADICTIONS — flagged continuity errors detected in the script
# -----------------------------------------------------------------------
async def test_contradictions(script_id: str):
    print("\n⚠️  Testing CONTRADICTIONS collection...")

    contra_id = await insert_document("contradictions", {
        "script_id": script_id,
        "sentence": "Arjun's green eyes scanned the room.",
        "conflict_with": "Arjun was established with brown eyes in Scene 1.",
        "scene_number": 12,
        "source_scene": 1,
        "reason_tag": "CHARACTER_TRAIT_VIOLATION",  # tag shown in the diff viewer
        "severity": "error",
        "resolved": False,                           # writer hasn't fixed it yet
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    print(f"  ✅ Contradiction logged with ID: {contra_id}")

    # Fetch all unresolved contradictions — shown as red flags in the editor
    unresolved = await find_many("contradictions", {
        "script_id": script_id,
        "resolved": False
    })
    print(f"  ✅ Unresolved contradictions found: {len(unresolved)}")

    # Mark as resolved — when writer fixes the issue
    await update_document("contradictions", contra_id, {"resolved": True})
    print(f"  ✅ Contradiction marked as resolved")

    return contra_id


# -----------------------------------------------------------------------
# ENHANCEMENTS — AI suggestions made on paragraphs
# -----------------------------------------------------------------------
async def test_enhancements(script_id: str):
    print("\n💡 Testing ENHANCEMENTS collection...")

    enhance_id = await insert_document("enhancements", {
        "script_id": script_id,
        "original_text": "The door was opened by Arjun slowly.",
        "enhanced_text": "Arjun slowly opened the door.",
        "reason_tag": "PASSIVE_VOICE",              # shown in diff viewer
        "reason_detail": "Converted passive voice to active for stronger pacing.",
        "accepted": None,                            # None = writer hasn't decided yet
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    print(f"  ✅ Enhancement saved with ID: {enhance_id}")

    # Writer accepts the suggestion
    await update_document("enhancements", enhance_id, {"accepted": True})
    print(f"  ✅ Enhancement accepted by writer")

    return enhance_id


# -----------------------------------------------------------------------
# STYLE FINGERPRINTS — personal writing voice extracted from uploads
# -----------------------------------------------------------------------
async def test_style_fingerprints(user_id: str):
    print("\n🖊️  Testing STYLE_FINGERPRINTS collection...")

    fp_id = await insert_document("style_fingerprints", {
        "user_id": user_id,
        "avg_sentence_length": 12.4,
        "lexical_diversity": 0.73,           # unique words / total words ratio
        "pos_distribution": {
            "NOUN": 0.31,
            "VERB": 0.22,
            "ADJ": 0.14
        },
        "common_phrases": ["cut to", "silence", "stares into"],
        "source_files": ["my_old_script.pdf", "short_film_2023.fountain"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    print(f"  ✅ Style Fingerprint saved with ID: {fp_id}")

    # Fetch fingerprint for a user — used when applying personal style
    fps = await find_many("style_fingerprints", {"user_id": user_id})
    print(f"  ✅ Style Fingerprint fetched, lexical diversity: {fps[0]['lexical_diversity']}")

    return fp_id


# -----------------------------------------------------------------------
# CLEANUP — deletes all test data so your DB stays clean after testing
# -----------------------------------------------------------------------
async def cleanup(user_id, project_id, script_id, bible_id, contra_id, enhance_id, fp_id):
    print("\n🧹 Cleaning up test data...")
    await delete_document("users", user_id)
    await delete_document("projects", project_id)
    await delete_document("scripts", script_id)
    await delete_document("story_bibles", bible_id)
    await delete_document("contradictions", contra_id)
    await delete_document("enhancements", enhance_id)
    await delete_document("style_fingerprints", fp_id)
    print("  ✅ All test documents deleted.")


# -----------------------------------------------------------------------
# MAIN — runs all tests in sequence
# -----------------------------------------------------------------------
async def main():
    print("🚀 Starting Kalam Database Tests...")
    print("=" * 50)

    await connect_db()

    # Each test passes its ID to the next — mimicking real app flow
    user_id    = await test_users()
    project_id = await test_projects(user_id)
    script_id  = await test_scripts(project_id)
    bible_id   = await test_story_bible(script_id)
    contra_id  = await test_contradictions(script_id)
    enhance_id = await test_enhancements(script_id)
    fp_id      = await test_style_fingerprints(user_id)

    await cleanup(user_id, project_id, script_id, bible_id, contra_id, enhance_id, fp_id)

    await close_db()

    print("\n" + "=" * 50)
    print("✅ ALL TESTS PASSED — Database is fully operational.")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())