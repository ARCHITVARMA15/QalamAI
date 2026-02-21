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
                    graph.add_node(ent_text, type=ent.label_, mentions=[scene_id], count=1)
                else:
                    graph.nodes[ent_text]["count"] = graph.nodes[ent_text].get("count", 0) + 1
                    # Track which scene this entity was mentioned in
                    if scene_id not in graph.nodes[ent_text]["mentions"]:
                        graph.nodes[ent_text]["mentions"].append(scene_id)
                
        # 2. Extract Relationships (Edges) - Co-occurrence within sentences
        known_entity_names = list(entities.keys())
        
        for sent in doc.sents:
            # Find which known global entities appear in this sentence
            # We use this instead of `sent.ents` because spaCy often misses entities in complex sentences
            sent_text = sent.text
            found_ents_in_sent = []
            for ent_name in known_entity_names:
                if ent_name in sent_text:
                    found_ents_in_sent.append(ent_name)
            
            # Find the main verb/action of the sentence for the relation label
            main_verbs = [tok for tok in sent if tok.pos_ == "VERB" or tok.dep_ == "ROOT"]
            relation_label = main_verbs[0].lemma_ if main_verbs else "interacts with"
            
            # If there are at least 2 entities in the sentence, link them all together
            if len(found_ents_in_sent) >= 2:
                # Create edges between all unique pairs in the sentence
                for i in range(len(found_ents_in_sent)):
                    for j in range(len(found_ents_in_sent)):
                        if i != j:
                            source_text = found_ents_in_sent[i]
                            target_text = found_ents_in_sent[j]
                            
                            # Only link if they are distinct entities
                            if source_text != target_text:
                                graph.add_edge(
                                    source_text, 
                                    target_text, 
                                    relation=relation_label, 
                                    scene_id=scene_id, 
                                    sentence=sent.text.strip()
                                )
        
        # NetworkX 3.x changed the output format of node_link_data. 
        # To strictly enforce the schema our frontend and DB expects, we serialize it manually.
        nodes_list = []
        for n, data in graph.nodes(data=True):
            node_data = {"id": n}
            node_data.update(data)
            nodes_list.append(node_data)
            
        links_list = []
        for u, v, data in graph.edges(data=True):
            link_data = {"source": u, "target": v}
            link_data.update(data)
            links_list.append(link_data)
            
        return {
            "directed": True,
            "multigraph": True,
            "graph": {},
            "nodes": nodes_list,
            "links": links_list
        }
                    
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
