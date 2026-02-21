import os
import sys
from pathlib import Path

# Add the parent directory (backend root) to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.knowledge_graph import KnowledgeGraphEngine

def main():
    print("Initializing Knowledge Graph Engine...")
    print("Loading models (this might take a few seconds)...")
    try:
        kg_engine = KnowledgeGraphEngine()
    except RuntimeError as e:
        print(f"\nError: {e}")
        return
    
    story_path = os.path.join(Path(__file__).parent.parent, "data", "story.txt")
    print(f"\nReading story file: {story_path}")
    
    try:
        with open(story_path, "r", encoding="utf-8") as f:
            story_text = f.read()
    except FileNotFoundError:
        print(f"Error: Could not find {story_path}. Ensure you're running this from the backend folder.")
        return

    print("Processing text to extract Story Bible elements...")
    kg_engine.process_text(story_text, scene_id="scene_001")
    
    print("\n" + "="*40)
    print("STORY BIBLE EXTRACTED:")
    print("="*40)
    
    print("\n[ ENTITIES / CHARACTERS / LOCATIONS ]")
    nodes = list(kg_engine.graph.nodes(data=True))
    if not nodes:
        print("No entities found.")
    for node, data in nodes:
        print(f" - {node} [{data.get('type')}] -> Mentions in: {data.get('mentions')}")
        
    print("\n[ RELATIONSHIPS / INTERACTIONS ]")
    edges = list(kg_engine.graph.edges(data=True))
    if not edges:
        print("No clear subject-verb-object relationships found between entities.")
    for u, v, data in edges:
        print(f" - {u} --({data.get('relation')})--> {v}")
        print(f"   Source Text: \"{data.get('sentence')}\"")
        
    print("\n" + "="*40)
    print("Done! This data can now be exported to the D3.js frontend.")

if __name__ == "__main__":
    main()
