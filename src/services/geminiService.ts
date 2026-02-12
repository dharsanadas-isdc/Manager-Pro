
import { GoogleGenAI } from "@google/genai";

export const getSmartReport = async (data: any, timeframe: string, role: 'manager' | 'member' = 'manager') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const context = role === 'manager' 
      ? 'You are a senior project manager. Analyze this performance data for bottlenecks and efficiency. Be concise.'
      : 'You are an encouraging team lead. Provide a short 2-sentence motivational summary based on this completion data.';
    
    const prompt = `${context}\n\nProject Performance Data: ${JSON.stringify(data)}\nTimeframe of analysis: ${timeframe}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error('AI Error:', error);
    return "Operational insights are currently offline. Please check your connection.";
  }
};
