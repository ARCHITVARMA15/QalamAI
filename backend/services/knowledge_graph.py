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
        
    def process_text(self, text: str, scene_id: str = "scene_1") -> Dict[str, Any]:
        """
        Process the text to extract entities and their relationships, 
        and add them to the knowledge graph.
        """
        # Initialize the knowledge graph for this session
        graph = nx.MultiDiGraph()
        
        doc = self.nlp(text)
        
        # 1. Extract Entities (Nodes)
        # We focus on characters (PERSON), locations (GPE, LOC, FAC), organizations (ORG), dates (DATE), and events (EVENT)
        valid_entity_labels = {"PERSON", "GPE", "LOC", "FAC", "ORG", "DATE", "EVENT"}
        entities = {} # Mapping of text to its label for the current doc
        
        for ent in doc.ents:
            if ent.label_ in valid_entity_labels:
                # Normalize entity name by stripping surrounding whitespace
                ent_text = ent.text.strip()
                entities[ent_text] = ent.label_
                
                # Add node to the graph if it doesn't already exist
                if not graph.has_node(ent_text):
                    graph.add_node(ent_text, type=ent.label_, mentions=[])
                
                # Track which scene this entity was mentioned in
                if scene_id not in graph.nodes[ent_text]["mentions"]:
                    graph.nodes[ent_text]["mentions"].append(scene_id)
                
        # 2. Extract Relationships (Edges) & Attributes
        for sent in doc.sents:
            # Reconstruct attributes (e.g., Arjun has blue eyes -> Arjun -(has)-> eyes(blue))
            # Find all verbs in the sentence
            verbs = [tok for tok in sent if tok.pos_ == "VERB" or tok.lemma_ == "have" or tok.lemma_ == "be"]
            
            for action in verbs:
                # Find direct subjects and objects of THIS SPECIFIC verb
                subjects = [tok for tok in action.children if "subj" in tok.dep_]
                objects = [tok for tok in action.children if "obj" in tok.dep_ or tok.dep_ == "attr" or tok.dep_ == "acomp"]
                
                # If there are conjunctions, also grab them (e.g. Arjun and Karan ran)
                for subj in list(subjects):
                    subjects.extend([t for t in subj.conjuncts])
                for obj in list(objects):
                    objects.extend([t for t in obj.conjuncts])

                if subjects and objects:
                    for subj in subjects:
                        for obj in objects:
                            subj_text = subj.text
                            
                            # Build a compound object text if adjectives are attached (e.g., "blue eyes")
                            obj_mods = [t.text for t in obj.children if t.pos_ == "ADJ"]
                            obj_text = f"{' '.join(obj_mods)} {obj.text}".strip() if obj_mods else obj.text

                            subj_ent = self._find_matching_entity(subj_text, entities)
                            # If the object isn't a named entity, we can still add it as a trait/item node
                            obj_ent = self._find_matching_entity(obj_text, entities) or obj_text
                            
                            if subj_ent and obj_ent and subj_ent != obj_ent:
                                # Add the object as an attribute/item node if it wasn't a formal entity
                                if not graph.has_node(obj_ent):
                                    graph.add_node(obj_ent, type="ATTRIBUTE", mentions=[scene_id])
                                
                                graph.add_edge(subj_ent, obj_ent, relation=action.lemma_, scene_id=scene_id, sentence=sent.text.strip())
        
        return nx.node_link_data(graph)
                    
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

        return None
