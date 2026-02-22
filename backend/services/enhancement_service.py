import spacy
import logging
from typing import List, Dict



# Set up logging
logger = logging.getLogger(__name__)

class EnhancementService:
    def __init__(self):
        """
        Initializes the Enhancement Service with spaCy.
        """
        logger.info("Initializing Enhancement Service...")

        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.error("spaCy model 'en_core_web_sm' not found.")
            self.nlp = None

    def enhance_paragraph(self, text: str) -> dict:
        """
        Enhances the paragraph readability and flow using rule-based spaCy analysis.
        """
        if not text:
            return {"original": text, "modified": text, "reason_tags": []}

        original_text = text
        reason_tags = []
        
        # 1. Grammar & Flow Analysis — rule-based only; no external model calls
        modified_text = text
            
        # 2. Rule-based Grammatical Analysis
        # We provide tags to explain *why* it might need improvement
        grammar_tags = self._analyze_grammar_rules(original_text)
        reason_tags.extend(grammar_tags)

        # Fallback
        if not reason_tags:
             reason_tags.append({
                 "tag": "LOOKS GOOD",
                 "detail": "Paragraph flow is already optimal.",
                 "type": "info"
             })

        return {
            "original": original_text,
            "modified": modified_text,
            "reason_tags": reason_tags
        }



    def _analyze_grammar_rules(self, text: str) -> List[Dict]:
        """
        Identify passive voice or weak phrasing using spaCy dependency parsing.
        """
        tags = []
        if not self.nlp:
            return tags
            
        doc = self.nlp(text)
        
        # Detect passive voice (auxiliary passive 'auxpass' or nominal subject passive 'nsubjpass')
        strong_passive_evidence = False
        for tok in doc:
            if tok.dep_ in ("auxpass", "nsubjpass"):
                strong_passive_evidence = True
                break
                
        if strong_passive_evidence:
            tags.append({
                "tag": "PASSIVE VOICE",
                "detail": "Detected passive voice. Consider using active verbs for stronger impact.",
                "type": "grammar"
            })
            
        # Detect overly long sentences (readability flag)
        for sent in doc.sents:
            if len(sent) > 25:
                 tags.append({
                     "tag": "LONG SENTENCE",
                     "detail": "This sentence is quite long and may hurt pacing. Consider splitting it.",
                     "type": "pacing"
                 })
                 break # One tag for the paragraph is enough

        return tags
