import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData, INSIGHT_SCHEMA, SmartInsight, PricingAnalysis, CashflowData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSmartInsights(invoice: InvoiceData): Promise<SmartInsight[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this invoice data and provide 3 smart insights to help the user optimize their billing, avoid errors, or improve cash flow.
      
      Invoice Data:
      ${JSON.stringify(invoice, null, 2)}
      
      Return a JSON array of insights.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: INSIGHT_SCHEMA
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const insights = JSON.parse(text);
    return insights.map((insight: any, index: number) => ({
      ...insight,
      id: `insight-${index}`
    }));
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}

export async function analyzePricing(items: any[]): Promise<PricingAnalysis[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the pricing of these items for a small business. 
      Items: ${JSON.stringify(items)}
      Provide a list of pricing analysis objects including suggested rates based on market trends.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              currentRate: { type: Type.NUMBER },
              suggestedRate: { type: Type.NUMBER },
              marketAverage: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              potentialRevenueIncrease: { type: Type.NUMBER }
            },
            required: ['itemName', 'currentRate', 'suggestedRate', 'marketAverage', 'reasoning', 'potentialRevenueIncrease']
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const analysis = JSON.parse(text);
    return analysis.map((a: any) => ({ ...a, id: Math.random().toString(36).substr(2, 9) }));
  } catch (error) {
    console.error("Error analyzing pricing:", error);
    return [];
  }
}

export async function forecastCashflow(history: any[]): Promise<CashflowData[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this billing history, forecast the next 6 months of cashflow.
      History: ${JSON.stringify(history)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              month: { type: Type.STRING },
              income: { type: Type.NUMBER },
              expenses: { type: Type.NUMBER },
              forecast: { type: Type.NUMBER }
            },
            required: ['month', 'income', 'expenses', 'forecast']
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error forecasting cashflow:", error);
    return [];
  }
}
