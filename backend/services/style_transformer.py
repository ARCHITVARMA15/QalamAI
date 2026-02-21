import spacy
import logging
from typing import Tuple, List, Dict

try:
    from transformers import pipeline
except ImportError as e:
    pipeline = None
    print(f"Transformers not installed or failed to import: {e}")

# Set up logging
logger = logging.getLogger(__name__)

class StyleTransformer:
    def __init__(self):
        """
        Initializes the Style Transformer with a local T5-small model and spaCy.
        """
        logger.info("Loading T5-small for style transformation...")
        self.model = None
        if pipeline is not None:
            try:
                # We use t5-small as per the LLM Usage Policy (local, lightweight)
                # Note: 'translation_en_to_fr' forces the T5ForConditionalGeneration pipeline 
                # to load properly, we control the actual task via prompt prefix
                self.model = pipeline(
                    "translation_en_to_fr", 
                    model="t5-small", 
                    device=-1 # CPU for now, can be updated to 0 for GPU if available
                )
            except Exception as e:
                logger.error(f"Failed to load T5-small: {e}")

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
        Transforms the text to the requested tone using T5-small and rule-based fallback.
        Returns the modified text and reason tags.
        """
        if not text:
            return {"original": text, "modified": text, "reason_tags": []}

        original_text = text
        reason_tags = []
        
        # 1. T5-small Translation (Syntax/Style Level)
        modified_text = self._apply_t5_transformation(text, tone)
        if modified_text != text:
             reason_tags.append({
                 "tag": f"{tone.upper()} TONE",
                 "detail": f"Rewrote structure to sound more {tone} using T5.",
                 "type": "structure"
             })
        
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

    def _apply_t5_transformation(self, text: str, tone: str) -> str:
        if not self.model:
            return text
            
        # T5-small prompts perform best with explicit translation-style commands
        # Although T5-small isn't perfectly instruction-tuned for "casual/formal" out-of-the-box like larger models, 
        # using translation phrasing often yields altered syntactical results.
        prompt = f"translate English to {tone} English: {text}"
        
        try:
             # Run inference
             result = self.model(prompt, max_length=len(text) + 50, num_return_sequences=1)
             generated_text = result[0]['generated_text'].strip()
             
             # Sub-optimal edge cases with small models: Sometimes they output the prompt back or fail to change it.
             # Only return if it actually produced something sensible
             if generated_text and len(generated_text) > 5:
                  return generated_text
        except Exception as e:
             logger.error(f"T5 generation failed: {e}")
             
        return text

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
