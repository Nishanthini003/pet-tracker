// In your pdfService.ts
import { getDocument, version, GlobalWorkerOptions } from 'pdfjs-dist';

export const extractPdfText = async (file: File): Promise<string> => {
  try {
    // Use the same version as your installed package
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument(arrayBuffer).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + "\n";
    }

    return text;
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw new Error("Failed to extract text from PDF");
  }
};