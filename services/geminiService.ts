
import { GoogleGenAI } from "@google/genai";

export const polishJobDescription = async (title: string, description: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert HR writing consultant specialized in Thai professional communication. 
      Professionalize the following job description for an internal job board in THAI LANGUAGE. 
      Make it engaging, clear, use professional Thai terminology, and highlight why an internal candidate should apply.
      Job Title: ${title}
      Current Description: ${description}
      
      Return ONLY the improved description text in Thai.`,
    });
    return response.text || description;
  } catch (error) {
    console.error("Gemini Error:", error);
    return description;
  }
};
