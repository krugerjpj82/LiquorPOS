
import { GoogleGenAI, Type } from "@google/genai";
import { AppState } from "../types";

export const geminiService = {
  getBusinessInsights: async (state: AppState) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze the current state of this Point of Sale system and provide 3-5 business insights.
      Current Products: ${JSON.stringify(state.products.map(p => ({ name: p.name, stock: p.stock, price: p.price })))}
      Recent Sales: ${JSON.stringify(state.sales.slice(-20).map(s => ({ total: s.total, items: s.items.length })))}
      
      Focus on inventory management, revenue trends, and items that need attention.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    priority: { type: Type.STRING, description: 'High, Medium, or Low' }
                  },
                  required: ["title", "content", "priority"]
                }
              },
              summary: { type: Type.STRING }
            },
            required: ["insights", "summary"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Insights Error:", error);
      throw error;
    }
  }
};
