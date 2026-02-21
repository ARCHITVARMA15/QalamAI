import io
import re
import fitz  # PyMuPDF
from docx import Document
from fastapi import UploadFile, HTTPException

class DocumentParser:
    """
    Handles extraction and cleaning of text from various document formats
    (PDF, DOCX, TXT).
    """

    @classmethod
    async def process_file(cls, file: UploadFile) -> list[str]:
        """
        Orchestrates the extraction based on the file content type or extension.
        Returns a list of extracted stories (usually 1, but multiple for anthologies).
        """
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

    @staticmethod
    def extract_text_from_pdf(content: bytes) -> str:
        """Extracts text from a PDF file using PyMuPDF."""
        text = ""
        # fitz.open requires a stream or filename, we can use a memory stream
        # However, for bytes directly, fitz.open("pdf", content) works
        try:
            with fitz.open("pdf", content) as doc:
                for page in doc:
                    text += page.get_text() + "\n"
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
        return text

    @staticmethod
    def extract_text_from_docx(content: bytes) -> str:
        """Extracts text from a DOCX file using python-docx."""
        try:
            doc = Document(io.BytesIO(content))
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")

    @staticmethod
    def extract_text_from_txt(content: bytes) -> str:
        """Extracts text from a TXT file."""
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
             # Fallback for common windows encoding if standard utf-8 fails
             return content.decode("windows-1252", errors="ignore")

    @staticmethod
    def clean_text(text: str) -> str:
        """
        Performs basic text cleanup and normalization.
        """
        if not text:
            return ""
            
        # 1. Clean Metadata (Copyrights, ISBNs)
        text = DocumentParser.clean_metadata(text)
            
        # 2. Replace multiple spaces with a single space
        cleaned = re.sub(r' +', ' ', text)
        
        # 3. Replace 3 or more consecutive newlines with exactly two newlines
        # This preserves paragraph breaks but removes excessive vertical whitespace
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        
        # Strip leading/trailing whitespace
        return cleaned.strip()

    @staticmethod
    def clean_metadata(text: str) -> str:
        """
        Strips common publishing boilerplate, metadata, copyright pages, and ISBNs.
        """
        # Remove standard copyright lines: Copyright (c) 2024, © 2022 Name
        text = re.sub(r'(?i)(?:copyright|©)\s*(?:\(c\))?\s*\d{4}.*?\n', '', text)
        
        # Remove "All rights reserved", "Printed in..."
        text = re.sub(r'(?i)all rights reserved\.?\n?', '', text)
        text = re.sub(r'(?i)printed in the (?:united states of america|usa|uk|india).*?\n', '', text)
        
        # Remove ISBNs
        text = re.sub(r'(?i)isbn(?:-1[03])?:?\s*[0-9X\- ]+\n', '', text)
        
        # Remove generic publishing boilerplate
        text = re.sub(r'(?i)no part of this publication may be reproduced.*?\n', '', text)
        text = re.sub(r'(?i)this is a work of fiction.*?\n', '', text)
        
        # Strip generic title page elements (e.g. "Written by", "Draft", "Version")
        # Ensure we don't accidentally wipe out real dialogue containing "written by"
        text = re.sub(r'(?im)^(?:\s*)(?:written|created|story) by\s*.*?\n', '', text)
        
        return text

    @staticmethod
    def split_stories(text: str) -> list[str]:
        """
        Attempts to detect if the document is an anthology / collection of multiple stories.
        If it finds major split markers (like three asterisks *** or repetitive Book/Story headers),
        it splits the text. Otherwise, it returns [text].
        """
        # If it's a Gutenberg book, try to strip the header and footer blocks entirely first
        if "*** START OF" in text:
            parts = re.split(r'\*\*\* START OF [^\*]+\*\*\*', text, maxsplit=1)
            text = parts[-1]
        
        if "*** END OF" in text:
            parts = re.split(r'\*\*\* END OF [^\*]+\*\*\*', text, maxsplit=1)
            text = parts[0]
            
        # A simple heuristic: if we see "STORY [Number/Word]" multiple times surrounded by newlines
        story_pattern = re.compile(r'(?i)\n\n\s*STORY\s+(?:\d+|[IVXLCDM]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\s*\n\n')
        
        matches = list(story_pattern.finditer(text))
        
        if len(matches) > 1:
            # We found multiple "STORY X" markers. Let's split!
            stories = []
            start_idx = 0
            
            for i, match in enumerate(matches):
                if i == 0:
                    start_idx = match.start()
                    continue
                    
                end_idx = match.start()
                story_content = text[start_idx:end_idx].strip()
                if story_content:
                    stories.append(story_content)
                start_idx = end_idx
                
            # append the last story
            final_story = text[start_idx:].strip()
            if final_story:
                stories.append(final_story)
                
            return stories
            
        # Fallback: Treat as a single document/script
        return [text]
