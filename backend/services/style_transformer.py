import spacy
import logging
from typing import Tuple, List



# Set up logging
logger = logging.getLogger(__name__)

class StyleTransformer:
    def __init__(self):
        """
        Initializes the Style Transformer with spaCy for rule-based matching.
        """
        logger.info("Initializing Style Transformer...")

        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.error("spaCy model 'en_core_web_sm' not found.")
            self.nlp = None
            
        # Basic dictionary for rule-based swaps (Fallback / Augmentation)
        self.formal_swaps = {
            "kids": "children",
            "buy": "purchase",
            "maybe": "perhaps",
            "get": "obtain",
            "fix": "repair",
            "bad": "suboptimal",
            "good": "excellent"
        }
        
        self.casual_swaps = {
            "children": "kids",
            "purchase": "buy",
            "perhaps": "maybe",
            "obtain": "get",
            "repair": "fix",
            "suboptimal": "bad",
            "excellent": "good"
        }

    def transform_style(self, text: str, tone: str) -> dict:
        """
        Transforms the text to the requested tone using rule-based vocabulary swaps.
        Returns the modified text and reason tags.
        """
        if not text:
            return {"original": text, "modified": text, "reason_tags": []}

        original_text = text
        reason_tags = []
        
        # 1. Syntax/style changes are delegated to the Groq-powered ai_tone handler.
        # This transformer focuses purely on rule-based vocabulary replacement (dictionary level).
        modified_text = text
        
        # 2. Rule-based Vocabulary Replacement (Dictionary Level)
        final_text, vocab_tags = self._apply_rule_based_swaps(modified_text, tone)
        reason_tags.extend(vocab_tags)
        
        # Fallback if both did nothing (rare)
        if final_text == original_text and not reason_tags:
             final_text = original_text
             reason_tags.append({
                 "tag": "UNCHANGED",
                 "detail": "No significant stylistic changes were necessary.",
                 "type": "info"
             })

        return {
            "original": original_text,
            "modified": final_text,
            "reason_tags": reason_tags
        }



    def _apply_rule_based_swaps(self, text: str, tone: str) -> Tuple[str, List]:
        if not self.nlp:
            return text, []
            
        doc = self.nlp(text)
        tokens = []
        tags = []
        
        swap_dict = self.formal_swaps if tone.lower() == "formal" else self.casual_swaps if tone.lower() == "casual" else {}
        
        for token in doc:
            word_lower = token.text.lower()
            if word_lower in swap_dict:
                replacement = swap_dict[word_lower]
                # Match casing roughly
                if token.text.istitle():
                    replacement = replacement.capitalize()
                
                tokens.append(replacement)
                tokens.append(token.whitespace_)
                
                tags.append({
                    "tag": "VOCABULARY",
                    "detail": f"Swapped '{token.text}' for '{replacement}' to fit {tone} tone.",
                    "type": "vocab"
                })
            else:
                tokens.append(token.text_with_ws)
                
        return "".join(tokens), tags
