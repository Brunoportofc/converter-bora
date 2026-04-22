import sys
from pypdf import PdfReader
from docx import Document

def convert_text_only(pdf_path, docx_path):
    try:
        reader = PdfReader(pdf_path)
        doc = Document()
        
        for page in reader.pages:
            text = page.extract_text()
            if text:
                doc.add_paragraph(text)
                doc.add_page_break()
        
        doc.save(docx_path)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_text_only.py <input_pdf> <output_docx>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if convert_text_only(input_path, output_path):
        print(f"Successfully converted {input_path} to {output_path}")
    else:
        sys.exit(1)
