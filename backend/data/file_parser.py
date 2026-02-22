import io
import re
import fitz  # PyMuPDF
from docx import Document
from fastapi import UploadFile, HTTPException


class DocumentParser:
    """
    Handles extraction and cleaning of text from various document formats
    (PDF, DOCX, TXT). Designed for literary/fiction content — aggressively
    strips publishing boilerplate, illustration tags, metadata, and page noise,
    then formats remaining prose with clean paragraph breaks.
    """

    @classmethod
    async def process_file(cls, file: UploadFile) -> list[str]:
        content = await file.read()
        filename = file.filename.lower()

        try:
            if filename.endswith(".pdf") or file.content_type == "application/pdf":
                raw_text = cls.extract_text_from_pdf(content)
            elif filename.endswith(".docx") or file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                raw_text = cls.extract_text_from_docx(content)
            elif filename.endswith(".txt") or file.content_type == "text/plain":
                raw_text = cls.extract_text_from_txt(content)
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

            cleaned_text = cls.clean_text(raw_text)
            stories = cls.split_stories(cleaned_text)
            return stories

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    # ─── Extractors ───────────────────────────────────────────────────────────

    @staticmethod
    def extract_text_from_pdf(content: bytes) -> str:
        text = ""
        try:
            with fitz.open("pdf", content) as doc:
                for page in doc:
                    text += page.get_text() + "\n"
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
        return text

    @staticmethod
    def extract_text_from_docx(content: bytes) -> str:
        try:
            doc = Document(io.BytesIO(content))
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")

    @staticmethod
    def extract_text_from_txt(content: bytes) -> str:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("windows-1252", errors="ignore")

    # ─── Main clean pipeline ──────────────────────────────────────────────────

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""

        # Step 1: Strip Project Gutenberg header / footer
        text = DocumentParser._strip_gutenberg_wrappers(text)

        # Step 2: Remove [Illustration: ...] and all square-bracket non-story tags
        text = DocumentParser._strip_bracket_tags(text)

        # Step 3: Remove publishing boilerplate blocks
        text = DocumentParser._strip_publishing_blocks(text)

        # Step 4: Remove noisy single-line artifacts (page numbers, running heads, etc.)
        text = DocumentParser._strip_line_noise(text)

        # Step 5: Normalize whitespace & build clean paragraphs
        text = DocumentParser._normalize_paragraphs(text)

        return text.strip()

    # ─── Step 1 ───────────────────────────────────────────────────────────────

    @staticmethod
    def _strip_gutenberg_wrappers(text: str) -> str:
        """Remove everything before *** START OF and after *** END OF."""
        if "*** START OF" in text or "***START OF" in text:
            parts = re.split(r'\*{2,3}\s*START OF[^\*]+\*{2,3}', text, maxsplit=1)
            text = parts[-1]
        if "*** END OF" in text or "***END OF" in text:
            parts = re.split(r'\*{2,3}\s*END OF[^\*]+\*{2,3}', text, maxsplit=1)
            text = parts[0]
        # Also strip "Produced by ...", "Updated editions will..." blocks at the top
        text = re.sub(r'(?s)^.*?(?=\n\s*(?:CHAPTER|Chapter|PART|Part|BOOK|Book|Prologue|PROLOGUE)\b)', '', text, count=1)
        return text

    # ─── Step 2 ───────────────────────────────────────────────────────────────

    @staticmethod
    def _strip_bracket_tags(text: str) -> str:
        """
        Remove [Illustration: ...], [Sidenote: ...], [Footnote: ...],
        [Image: ...], [Fig ...], and any short all-caps bracketed label.
        Also strips curly-brace metadata blocks.
        """
        # Multi-line bracket tags like [Illustration: ... ]
        text = re.sub(r'\[Illustration[^\]]*\]', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'\[Sidenote[^\]]*\]', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'\[Footnote[^\]]*\]', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'\[Image[^\]]*\]', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'\[Fig[^\]]*\]', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'\[Transcriber[^\]]*\]', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'\[Editor[^\]]*\]', '', text, flags=re.IGNORECASE | re.DOTALL)
        # Any remaining short bracketed label (≤ 80 chars, not dialogue/story)
        text = re.sub(r'\[[A-Z][^\]]{0,80}\]', '', text)
        # Curly brace metadata
        text = re.sub(r'\{[^}]*\}', '', text)
        return text

    # ─── Step 3 ───────────────────────────────────────────────────────────────

    # Patterns that identify non-story boilerplate BLOCKS (multi-line aware)
    _BLOCK_PATTERNS = [
        # Publisher / printer credits
        r'(?i)(?:ruskin house|chiswick press|charles whittingham).*',
        r'(?i)(?:tooks court|chancery lane|charing cross road).*',
        r'(?i)(?:george allen|macmillan|penguin books?|harper collins?|penguin classics?).*(?:publisher|press|london|new york).*',
        r'(?i)(?:published by|first published|this edition published).*',
        r'(?i)printing history.*',
        # Copyright / legal
        r'(?i)copyright\s*(?:\(c\)|©)?\s*\d{4}.*',
        r'(?i)©\s*\d{4}.*',
        r'(?i)all rights reserved\.?',
        r'(?i)no part of this (?:publication|book|work) may be reproduced.*',
        r'(?i)printed in (?:the united states|great britain|the u\.?s\.?a\.?|india).*',
        r'(?i)isbn(?:-1[03])?:?\s*[\dX\- ]+',
        # Dedications / preface markers (keep the label, strip the block? — here we strip label-only lines)
        r'(?i)^to\s+[A-Z][a-z].*\bin\s+(?:acknowledgment|memory|honor|honour)\b.*',
        r'(?i)these illustrations are gratefully inscribed.*',
        # Title page fragments — short lines that are only proper nouns / publisher info
        r'(?i)^(?:by|with a preface by|with illustrations by|translated by)\s+[A-Z].*',
        r'(?i)^(?:with an introduction by|edited by|annotated by)\s+[A-Z].*',
        # Transcriber / scanner notes
        r'(?i)transcriber.s note.*',
        r'(?i)this e(?:book|text) was produced.*',
        r'(?i)scanned and proofed by.*',
        # "This is a work of fiction" disclaimers
        r'(?i)this is a work of fiction.*',
        r'(?i)any resemblance to (?:actual|real) (?:persons?|events?).*',
    ]

    @staticmethod
    def _strip_publishing_blocks(text: str) -> str:
        """Remove lines that match known publishing/metadata patterns."""
        lines = text.split('\n')
        cleaned = []
        skip_blank_run = False  # collapse blank lines after removed blocks

        for line in lines:
            stripped = line.strip()
            removed = False
            for pat in DocumentParser._BLOCK_PATTERNS:
                if re.match(pat, stripped):
                    removed = True
                    break

            # Also remove lines that look like a bare address / publisher fragment:
            # e.g. "156 CHARING CROSS ROAD", "LONDON", "Ruskin House"
            if not removed:
                removed = DocumentParser._is_address_or_publisher_fragment(stripped)

            if removed:
                skip_blank_run = True
            else:
                if stripped == '' and skip_blank_run:
                    pass  # swallow the blank line immediately after a removed block
                else:
                    skip_blank_run = False
                    cleaned.append(line)

        return '\n'.join(cleaned)

    @staticmethod
    def _is_address_or_publisher_fragment(line: str) -> bool:
        """
        Detect short lines that are purely publisher address / city / road fragments.
        e.g. "LONDON", "156 Charing Cross Road", "Ruskin House", "George Allen."
        """
        if not line or len(line) > 80:
            return False

        # Looks like a street address
        if re.match(r'^\d+[\.\,]?\s+[A-Z][A-Za-z\s]+(?:Road|Street|Lane|Court|House|Row|Place|Square|Avenue)\.?$', line):
            return True

        # All caps short word(s) that are city / country names common in old title pages
        if re.match(r'^[A-Z][A-Z\s\.\,\-]{2,40}$', line) and len(line.split()) <= 5:
            # But don't remove all-caps CHAPTER headings
            if not re.match(r'^(?:CHAPTER|PART|BOOK|VOLUME|ACT|SCENE|EPILOGUE|PROLOGUE)', line):
                return True

        # Lines like "George Allen." or "Ruskin House." (title case, ends with period, ≤ 4 words)
        if re.match(r'^[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){0,3}[,\.]?$', line) and len(line.split()) <= 4:
            # Don't strip character names that appear mid-paragraph — these are standalone lines
            # Heuristic: if it looks like "Publisher Name." with exactly 1-3 words, flag it
            words = line.rstrip('.,').split()
            if len(words) <= 3 and all(w[0].isupper() for w in words):
                return True

        return False

    # ─── Step 4 ───────────────────────────────────────────────────────────────

    @staticmethod
    def _strip_line_noise(text: str) -> str:
        """
        Remove per-line garbage:
        - Lone page numbers (just digits or Roman numerals on their own line)
        - Running headers / footers (short repeated all-caps lines)
        - Lines that are only dashes, underscores, asterisks
        - Lines that are only a year (1894, etc.)
        """
        lines = text.split('\n')
        cleaned = []
        for line in lines:
            s = line.strip()
            # Blank — keep for paragraph structure
            if s == '':
                cleaned.append(line)
                continue
            # Lone page number
            if re.match(r'^[IVXLCDM]+$', s) or re.match(r'^\d{1,4}$', s):
                continue
            # Lone year 4 digits (e.g. "1894" on its own line)
            if re.match(r'^[12]\d{3}$', s):
                continue
            # Only punctuation / decorative chars
            if re.match(r'^[\*\-\=\_\~\#\+\.]{2,}$', s):
                continue
            # Very short all-caps that aren't structural headings (≤ 2 words, e.g. "PREFACE" is ok but "LONDON" was handled above)
            cleaned.append(line)

        return '\n'.join(cleaned)

    # ─── Step 5 ───────────────────────────────────────────────────────────────

    @staticmethod
    def _normalize_paragraphs(text: str) -> str:
        """
        Rebuild the text with clean, consistent paragraph breaks:
        - Collapse 3+ blank lines → 1 blank line (double newline)
        - Preserve intentional single blank line (paragraph boundary)
        - Re-join lines within the same paragraph that were broken mid-sentence
          (common in PDF extraction and Gutenberg TXT files)
        - Ensure chapter/section headings are isolated on their own line
        """
        # Normalize Windows line endings
        text = text.replace('\r\n', '\n').replace('\r', '\n')

        # Split into blocks separated by blank lines
        raw_blocks = re.split(r'\n{2,}', text)

        paragraphs = []
        for block in raw_blocks:
            # Within each block, join lines that were artificially broken
            # A line break is "artificial" if:
            #   - previous line doesn't end with sentence-ending punctuation (.!?:;"')
            #   - or next line starts with a lowercase letter
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            if not lines:
                continue

            joined = DocumentParser._rejoin_broken_lines(lines)

            # Check if this block is a heading (chapter title, part, act, etc.)
            if DocumentParser._is_heading(joined):
                paragraphs.append('\n' + joined.strip())
            else:
                paragraphs.append(joined.strip())

        # Join all paragraphs with a blank line between them
        return '\n\n'.join(p for p in paragraphs if p.strip())

    @staticmethod
    def _rejoin_broken_lines(lines: list[str]) -> str:
        """
        Re-joins lines that were soft-wrapped (PDF / Gutenberg artifact).
        Keeps hard breaks only at ends of sentences or before capital-starting new sentences.
        """
        if len(lines) == 1:
            return lines[0]

        result = lines[0]
        for i in range(1, len(lines)):
            prev = result
            curr = lines[i]
            # If previous line ends with sentence-terminator → hard break
            if re.search(r'[.!?;:"\u2019\u201d]\s*$', prev):
                result = prev + ' ' + curr
            # If current line starts lowercase → continuation of previous sentence
            elif curr and curr[0].islower():
                result = prev + ' ' + curr
            # If previous line ends with a comma or conjunction → continuation
            elif re.search(r'[,\-]\s*$', prev):
                result = prev + ' ' + curr
            else:
                # Looks like a real line break — keep as space join (single para)
                result = prev + ' ' + curr

        return result

    @staticmethod
    def _is_heading(text: str) -> bool:
        """
        Returns True if the text looks like a chapter/part/act heading
        rather than prose.
        """
        t = text.strip()
        heading_patterns = [
            r'(?i)^(?:chapter|part|book|volume|act|scene|section|epilogue|prologue)\b',
            r'(?i)^(?:CHAPTER|PART|BOOK|ACT|SCENE)\s+(?:\d+|[IVXLCDM]+|[A-Z]+)$',
            r'^[IVXLCDM]+\.$',  # Roman numeral alone
        ]
        for pat in heading_patterns:
            if re.match(pat, t):
                return True
        return False

    # ─── Story splitting ──────────────────────────────────────────────────────

    @staticmethod
    def split_stories(text: str) -> list[str]:
        """
        Splits anthology / collection into individual stories if multiple
        STORY X markers are found. Otherwise returns [text].
        """
        story_pattern = re.compile(
            r'(?i)\n\n\s*STORY\s+(?:\d+|[IVXLCDM]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\s*\n\n'
        )
        matches = list(story_pattern.finditer(text))

        if len(matches) > 1:
            stories = []
            start_idx = 0
            for i, match in enumerate(matches):
                if i == 0:
                    start_idx = match.start()
                    continue
                chunk = text[start_idx:match.start()].strip()
                if chunk:
                    stories.append(chunk)
                start_idx = match.start()
            final = text[start_idx:].strip()
            if final:
                stories.append(final)
            return stories

        return [text]
