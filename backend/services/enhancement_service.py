import spacy
import logging
from typing import List, Dict

try:
    from transformers import pipeline
except ImportError as e:
    pipeline = None
    print(f"Transformers not installed or failed to import: {e}")

# Set up logging
logger = logging.getLogger(__name__)

class EnhancementService:
    def __init__(self):
        """
        Initializes the Enhancement Service with T5-small and spaCy explicitly.
        """
        logger.info("Loading T5-small for enhancement...")
        self.model = None
        if pipeline is not None:
            try:
                self.model = pipeline(
                    "translation_en_to_fr", 
                    model="t5-small", 
                    device=-1
                )
            except Exception as e:
                logger.error(f"Failed to load T5-small: {e}")

        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.error("spaCy model 'en_core_web_sm' not found.")
            self.nlp = None

    def enhance_paragraph(self, text: str) -> dict:
        """
        Enhances the paragraph readability and flow using T5 and spaCy rules.
        """
        if not text:
            return {"original": text, "modified": text, "reason_tags": []}

        original_text = text
        reason_tags = []
        
        # 1. T5-small Rewrite (Grammar/Flow Improvement)
        modified_text = self._apply_t5_enhancement(text)
        if modified_text.lower() != text.lower() and modified_text:
             reason_tags.append({
                 "tag": "FLOW & CLARITY",
                 "detail": "Rewrote sentence structure for better flow.",
                 "type": "structure"
             })
        else:
            modified_text = text
            
        # 2. Rule-based Grammatical Analysis (Feedback tags directly on original/modified)
        # Even if T5 rewrote it, we provide passive voice tags to explain *why* it might have been improved
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

    def _apply_t5_enhancement(self, text: str) -> str:
        if not self.model:
            return text
            
        prompt = f"enhance: {text}"
        
        try:
             result = self.model(prompt, max_length=len(text) + 50, num_return_sequences=1)
             generated_text = result[0]['generated_text'].strip()
             
             if generated_text and len(generated_text) > 5:
                  return generated_text
        except Exception as e:
             logger.error(f"T5 enhancement extraction failed: {e}")
             
        return text

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
