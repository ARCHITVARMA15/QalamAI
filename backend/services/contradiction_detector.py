import spacy
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class ContradictionDetector:
    def __init__(self):
        """
        Initialize the Contradiction Detector.
        """
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            raise RuntimeError("spaCy model 'en_core_web_sm' not found.")
        
        self.vectorizer = TfidfVectorizer()

    def check_sentence(self, sentence: str, existing_nodes: List[Dict], existing_links: List[Dict]) -> List[Dict[str, str]]:
        """
        Checks a new sentence against the existing Story Bible for contradictions.
        Returns a list of flags if contradictions are found.
        """
        doc = self.nlp(sentence)
        flags = []
        
        # 1. Extract subjects and basic facts from the incoming sentence
        subjects = [tok for tok in doc if ("subj" in tok.dep_)]
        verbs = [tok for tok in doc if tok.pos_ == "VERB"]
        negations = [tok for tok in doc if tok.dep_ == "neg"]
        
        is_negated = len(negations) > 0
        
        if not subjects or not verbs:
            return flags # Not enough information to check for contradiction
            
        subj_text = subjects[0].text
        verb_lemma = verbs[0].lemma_
        
        # Find matching entities in the Knowledge Graph
        # We look at all nodes to see if our subject matches any existing entity
        target_entity = None
        for node in existing_nodes:
            node_id = node.get("id", "")
            if subj_text in node_id or node_id in subj_text:
                target_entity = node_id
                break
                
        if not target_entity:
            return flags # Entity not in the graph yet, so it can't contradict existing facts
            
        # 2. Retrieve existing facts (edges) for this entity
        # We look for links where the entity is the source
        existing_edges = [link for link in existing_links if link.get("source") == target_entity]
        
        if not existing_edges:
            return flags
            
        # 3. Rule-based + Semantic check
        # We compare the new sentence against the source sentences of existing edges
        existing_sentences = [edge.get('sentence', '') for edge in existing_edges]
        if not existing_sentences:
            return flags
            
        # Compute TF-IDF similarity
        all_texts = [sentence] + existing_sentences
        tfidf_matrix = self.vectorizer.fit_transform(all_texts)
        cosine_sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        
        # Check if there is highly similar existing fact
        for idx, similarity in enumerate(cosine_sims):
            if similarity > 0.15: # Threshold for semantic overlap
                existing_fact = existing_sentences[idx]
                existing_edge_data = existing_edges[idx]
                existing_verb = existing_edge_data.get('relation', '')
                
                # Check for direct contradictions (e.g., opposite polarity or mutually exclusive states)
                # This is a simplified rule: if they are semantically similar but one is negated and the other isn't
                # Or if they use antonym-like verbs
                
                existing_doc = self.nlp(existing_fact)
                existing_negations = [tok for tok in existing_doc if tok.dep_ == "neg"]
                existing_is_negated = len(existing_negations) > 0
                
                if (is_negated != existing_is_negated) and (verb_lemma == existing_verb):
                    flags.append({
                        "reason_tag": "CONTINUITY ERROR",
                        "reason_detail": f"This contradicts an established fact. Existing context: '{existing_fact}'",
                        "conflicting_sentence": sentence
                    })
                
                # Further constraint rules can be added here (e.g., location conflicts, state conflicts)
                
        return flags
