import spacy
from typing import List, Dict, Any

class PersonaGenerator:
    def __init__(self):
        try:
            # We use the same model as the knowledge graph to share resources
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            raise RuntimeError("spaCy model 'en_core_web_sm' not found.")

    def generate_personas(self, text: str) -> List[Dict[str, Any]]:
        doc = self.nlp(text)
        
        # Track mentions and traits for each PERSON entity
        personas: Dict[str, Dict[str, Any]] = {}
        
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                # Normalize entity name
                ent_text = ent.text.strip()
                if not ent_text:
                    continue
                    
                if ent_text not in personas:
                    personas[ent_text] = {
                        "id": ent_text,
                        "mentions": 0,
                        "traits": []
                    }
                personas[ent_text]["mentions"] += 1
                
        # Second pass: find traits (adjectives and descriptions associated with characters)
        for sent in doc.sents:
            for token in sent:
                # Looking for adjectives
                if token.pos_ == "ADJ":
                    # Case 1: amod (adjectival modifier) -> "the brave Elena"
                    if token.dep_ == "amod" and token.head.text in personas:
                        self._add_trait(personas[token.head.text], token.text.lower(), sent.text)
                    
                    # Case 2: acomp (adjectival complement) -> "Elena is brave"
                    # Here the adjective's head is usually a linking verb (is, seems, looks)
                    elif token.dep_ == "acomp":
                        for child in token.head.children:
                            # If a child of the verb is the subject and it's a known person
                            if child.dep_ in ("nsubj", "nsubjpass") and child.text in personas:
                                self._add_trait(personas[child.text], token.text.lower(), sent.text)
                    
                    # Case 3: attr (attribute) -> "Marcus is a strong man" (can also pull nouns as traits)
                    # For simplicity, we stick to adjectives. But sometimes the dep parser might map
                    # adjectives differently, let's catch direct connections just in case.
                    elif token.head.text in personas and token.dep_ not in ("amod", "acomp"):
                        self._add_trait(personas[token.head.text], token.text.lower(), sent.text)

        # Filter out minor characters (e.g. mentioned only once with no traits) 
        # to keep the list focused on main personas
        result = [p for p in personas.values() if p["mentions"] > 0 or len(p["traits"]) > 0]
        
        # Format the return structure specifically for the frontend
        return [{
            "story": text,
            "nodes": result
        }]
        
    def _add_trait(self, persona: Dict[str, Any], attribute: str, evidence: str) -> None:
        # Check if attribute already exists to avoid duplicates
        if not any(t["attribute"] == attribute for t in persona["traits"]):
            persona["traits"].append({
                "attribute": attribute,
                "evidence": evidence.strip()
            })
