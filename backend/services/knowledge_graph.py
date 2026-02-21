import spacy
import networkx as nx
from typing import Dict, Any

class KnowledgeGraphEngine:
    def __init__(self):
        # Load the English NLP model for Named Entity Recognition and Dependency Parsing
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            raise RuntimeError("spaCy model 'en_core_web_sm' not found. Please run: python -m spacy download en_core_web_sm")
        
        # Initialize the knowledge graph (Story Bible)
        self.graph = nx.MultiDiGraph()
        
    def process_text(self, text: str, scene_id: str = "scene_1") -> None:
        """
        Process the text to extract entities and their relationships, 
        and add them to the knowledge graph.
        """
        doc = self.nlp(text)
        
        # 1. Extract Entities (Nodes)
        # We focus on characters (PERSON), locations (GPE, LOC, FAC), and organizations (ORG)
        valid_entity_labels = {"PERSON", "GPE", "LOC", "FAC", "ORG"}
        entities = {} # Mapping of text to its label for the current doc
        
        for ent in doc.ents:
            if ent.label_ in valid_entity_labels:
                # Normalize entity name by stripping surrounding whitespace
                ent_text = ent.text.strip()
                entities[ent_text] = ent.label_
                
                # Add node to the graph if it doesn't already exist
                if not self.graph.has_node(ent_text):
                    self.graph.add_node(ent_text, type=ent.label_, mentions=[])
                
                # Track which scene this entity was mentioned in
                if scene_id not in self.graph.nodes[ent_text]["mentions"]:
                    self.graph.nodes[ent_text]["mentions"].append(scene_id)
                
        # 2. Extract Basic Relationships (Edges)
        # We use standard subject-verb-object extraction from dependency parsing as a heuristic
        for sent in doc.sents:
            subjects = [tok for tok in sent if ("subj" in tok.dep_)]
            objects = [tok for tok in sent if ("obj" in tok.dep_)]
            verbs = [tok for tok in sent if tok.pos_ == "VERB"]
            
            if subjects and objects and verbs:
                # Use the first subject, object, and verb found in the sentence
                subj = subjects[0].text
                obj = objects[0].text
                verb = verbs[0].lemma_
                
                # Check if the extracted subject and object match our known entities
                subj_ent = self._find_matching_entity(subj, entities)
                obj_ent = self._find_matching_entity(obj, entities)
                
                if subj_ent and obj_ent and subj_ent != obj_ent:
                    # Add a directed edge representing the relationship
                    self.graph.add_edge(subj_ent, obj_ent, relation=verb, scene_id=scene_id, sentence=sent.text.strip())
                    
    def _find_matching_entity(self, token_text: str, entities: Dict[str, str]) -> str:
        """
        Helper method to match a token from dependency parsing to an extracted entity.
        Returns the entity name if matched, else None.
        """
        for ent_name in entities:
            # Simple substring matching for now (e.g., 'Arjun' in 'Arjun')
            if token_text in ent_name or ent_name in token_text:
                return ent_name
        return None

    def get_graph_data(self) -> Dict[str, Any]:
        """
        Export the graph data into a JSON-serializable format suitable for D3.js visualization.
        """
        return nx.node_link_data(self.graph)
