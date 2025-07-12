import axios from "axios";

interface GeminiResponse {
  title: string;
  description: string;
  category: string;
  submittedBy: string;
  address: string;
  contact: string;
}

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const API_KEY = "AIzaSyDlHxdq_vyQGyxuLQQ1vIQ6ZWQUsa2_6Gg"; // Replace with your actual API key

export const getFromGemini = async (text: string): Promise<GeminiResponse | null> => {
  try {
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Analyze and enhance the following text for ai to classify and return only a valid JSON response formatted as: 
            { 
              "title": "", 
              "description": "",
              "submittedBy: "",
              "address": "" 
              "contact: ""
            }
             
            text to analyze is ${text}`
          }]
        }],
        generationConfig: {
          response_mime_type: "application/json" // Encourage JSON response
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("Full API response:", response.data);

    // Extract the generated text content
    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("Empty response from Gemini API");
    }

    console.log("Raw content:", content);

    // Safely extract and parse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON format from Gemini API");
    }

    try {
      const parsedData = JSON.parse(jsonMatch[0]) as GeminiResponse;
      return parsedData;
    } catch (parseError) {
      throw new Error("Failed to parse JSON response");
    }
  } catch (error: any) {
    console.error("Error in Gemini API:", error.response?.data || error.message);
    return null;
  }
};