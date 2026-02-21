import asyncio
import sys
import re
from pathlib import Path

# Add the parent directory (backend root) to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.db import get_database, connect_db, close_db
from services.knowledge_graph import KnowledgeGraphEngine

async def run_end_to_end_test():
    print("=== KNOWLEDGE GRAPH END-TO-END TEST ===")
    print("1. Initializing Database Connection...")
    await connect_db()
    db = get_database()
    
    print("2. Fetching a real story script from the database...")
    # Get the latest script that has content
    cursor = db["scripts"].find({"content": {"$ne": "", "$exists": True}}).sort("_id", -1).limit(1)
    scripts = await cursor.to_list(length=1)
    
    if not scripts:
        print("ERROR: No scripts with content found in the database. Please write a story in the editor first.")
        await close_db()
        return
        
    script = scripts[0]
    script_id = str(script.get("_id", ""))
    content = script.get("content", "")
    
    # Strip HTML tags if content is from rich text editor
    clean_content = re.sub('<[^<]+?>', ' ', content).replace('&nbsp;', ' ').strip()
    
    print(f"   -> Found Script ID: {script_id}")
    print(f"   -> Content Length: {len(clean_content)} characters")
    print(f"   -> Snippet: {clean_content[:150]}...\n")
    
    print("3. Initializing AI Knowledge Graph Engine...")
    try:
        kg_engine = KnowledgeGraphEngine()
    except Exception as e:
        print(f"ERROR loading NLP: {e}")
        await close_db()
        return
        
    print("4. Processing text through NLP Pipeline...")
    try:
        res = kg_engine.process_text(clean_content, scene_id=script_id)
    except Exception as e:
        print(f"ERROR during processing: {e}")
        await close_db()
        return
        
    nodes = res.get("nodes", [])
    links = res.get("links", [])
    
    print("\n=== RESULTS ===")
    print(f"Total Nodes Extracted: {len(nodes)}")
    print(f"Total Links Extracted: {len(links)}")
    
    print("\n--- NODES ---")
    for i, node in enumerate(nodes[:10]):
        print(f"  {i+1}. {node['id']} (Type: {node.get('type')}, Mentions: {node.get('count', 1)})")
    if len(nodes) > 10: print("  ...")
        
    print("\n--- LINKS ---")
    if not links:
        print("  ERROR: NO LINKS EXTRACTED! The graph will be disconnected.")
    else:
        for i, link in enumerate(links[:15]):
            print(f"  {i+1}. [ {link['source']} ] --({link.get('relation')})--> [ {link['target']} ]")
        if len(links) > 15: print("  ...")
            
    print("\n5. Checking Database State (Story Bible)...")
    bible = await db["story_bibles"].find_one({"script_id": script_id})
    if bible:
        db_nodes = bible.get("nodes", [])
        db_links = bible.get("links", [])
        print(f"   -> Database has {len(db_nodes)} nodes and {len(db_links)} links for this script.")
        if len(db_links) == 0 and len(links) > 0:
            print("   -> WARNING: NLP extracted links, but database has 0. (You might need to click Analyze in the UI)")
        elif len(db_links) == 0 and len(links) == 0:
            print("   -> ERROR: NLP failed to extract links, and database is empty too.")
    else:
        print("   -> No Story Bible saved in DB yet for this script.")
        
    print("\n=== FINISHED ===")
    await close_db()

if __name__ == "__main__":
    asyncio.run(run_end_to_end_test())
