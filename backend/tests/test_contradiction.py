import os
import sys
from pathlib import Path

# Add the parent directory (backend root) to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.knowledge_graph import KnowledgeGraphEngine
from services.contradiction_detector import ContradictionDetector

def main():
    print("Initializing Knowledge Graph Engine...")
    kg_engine = KnowledgeGraphEngine()
    
    print("Initializing Contradiction Detector...")
    detector = ContradictionDetector(kg_engine)
    
    # Let's seed the graph with our previous story
    story = "Meera waited nervously in Mumbai, hoping Arjun would return safely."
    kg_engine.process_text(story, scene_id="scene_001")
    print(f"\n[Story Bible established]: '{story}'\n")
    
    # Test cases
    test_sentences = [
        "Meera did not wait in Mumbai.", # Direct negation of an established fact
        "Arjun was exploring the cave.", # New fact, shouldn't contradict
    ]
    
    print("="*40)
    print("RUNNING CONTRADICTION CHECKS")
    print("="*40)
    
    for idx, sentence in enumerate(test_sentences):
        print(f"\nTEST {idx+1}: '{sentence}'")
        flags = detector.check_sentence(sentence, scene_id="scene_002")
        
        if flags:
            print("❌ CONTRADICTION FOUND:")
            for flag in flags:
                print(f"   [{flag['reason_tag']}] {flag['reason_detail']}")
        else:
            print("✅ No contradictions detected.")

if __name__ == "__main__":
    main()
