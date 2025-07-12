import axios from "axios";

const OCR_API_URL = "http://localhost:5000/api/ocr/process-image";

export const extractTextFromImage = async (imageUrl: string) => {
  try {
    const response = await axios.post(OCR_API_URL, { imageUrl });

    if (response.data.extractedText?.length > 2) {
      return response.data.extractedText[2].data.toString();
    } else {
      console.warn("No valid extracted text found.");
      return null;
    }
  } catch (error) {
    console.error("Error in OCR processing:", error.response?.data || error.message);
    return null;
  }
};
