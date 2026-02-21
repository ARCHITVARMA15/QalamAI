import asyncio
import io
import fitz # PyMuPDF
from docx import Document
from fastapi import UploadFile
from fastapi.datastructures import Headers
import sys
import os

# Add the parent directory to sys.path so we can import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.file_parser import DocumentParser

def create_mock_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Test PDF Content", fontsize=11)
    return doc.write()

def create_mock_docx() -> bytes:
    doc = Document()
    doc.add_paragraph("Test DOCX Content")
    
    file_stream = io.BytesIO()
    doc.save(file_stream)
    return file_stream.getvalue()

def create_mock_upload_file(filename: str, content: bytes, content_type: str) -> UploadFile:
    file = io.BytesIO(content)
    upload_file = UploadFile(
        file=file,
        size=len(content),
        filename=filename,
        headers=Headers({"content-type": content_type})
    )
    return upload_file

async def run_tests():
    print("Starting tests...")
    
    try:
        # 1. Test TXT
        print("Testing TXT extraction...")
        txt_content = b"Test TXT Content\nWith multiple   spaces   \n\n\nand lines."
        txt_file = create_mock_upload_file("test.txt", txt_content, "text/plain")
        extracted_txt = await DocumentParser.process_file(txt_file)
        assert "Test TXT Content" in extracted_txt[0]
        print("✅ TXT extraction passed!")
        
        # 2. Test PDF
        print("Testing PDF extraction...")
        pdf_content = create_mock_pdf()
        pdf_file = create_mock_upload_file("test.pdf", pdf_content, "application/pdf")
        extracted_pdf = await DocumentParser.process_file(pdf_file)
        assert "Test PDF Content" in extracted_pdf[0]
        print("✅ PDF extraction passed!")
        
        # 3. Test DOCX
        print("Testing DOCX extraction...")
        docx_content = create_mock_docx()
        docx_file = create_mock_upload_file("test.docx", docx_content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        extracted_docx = await DocumentParser.process_file(docx_file)
        assert "Test DOCX Content" in extracted_docx[0]
        print("✅ DOCX extraction passed!")
        
        print("\n🎉 All tests passed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(run_tests())
