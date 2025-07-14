// import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from '@google/genai';


// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

export const askGemini = async (prompt) => {
  try {

    // const model = await ai.models.generateContentStream({        // --> ai  is not defined, it fetches API key. hence genAI variable
    // const model = await genAI.models.generateContentStream({
    //   // model: "models/gemini-pro",                    // Gemini now expects the full model path, not just "gemini-pro".
    //   model: "gemini-1.9-flash",
    //   // contents: "content"
    // });

    // const result = await model.generateContent(prompt);
    // const result = await genAI.models.generateContent({
    const result = await genAI.models.generateContentStream({

      // model: "models/gemini-1.9.0-flash", // or gemini-1.5-pro
      model: 'gemini-2.0-flash-001',

      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    console.log(result);


    // let response = "";
    // for await (const chunk of result.stream) {
    //   response += chunk.text();
    // }
    // return response || "Gemini returned empty response.";

    
    // const text = result?.response?.text();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || "Gemini returned no response.";

    // const response = await result.response;
    // return response.text();


  } catch (error) {
    console.error("Gemini API error:", error);
    return "Gemini failed to generate a response.";
  }
};