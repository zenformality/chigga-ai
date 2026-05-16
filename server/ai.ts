import { GoogleGenAI } from "@google/genai";
import { HfInference } from "@huggingface/inference";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Gemini Setup
const geminiApiKey = process.env.GEMINI_API_KEY;
export const geminiAi = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
export const GEMINI_MODEL = "gemini-1.5-flash";

// Hugging Face Setup
const hfToken = process.env.HUGGING_FACE_ACCESS_TOKEN || process.env.VITE_HUGGING_FACE_ACCESS_TOKEN;
export const hf = hfToken ? new HfInference(hfToken) : null;

// Featherless AI Setup
const featherlessApiKey = process.env.FEATHERLESS_API_KEY;
export const featherless = featherlessApiKey ? new OpenAI({
  apiKey: featherlessApiKey,
  baseURL: "https://api.featherless.ai/v1"
}) : null;

export const FEATHERLESS_NSFW_MODEL = "DavidAU/Qwen3-0.6B-heretic-abliterated-uncensored";
export const HF_SFW_MODEL = "Qwen/Qwen2.5-72B-Instruct";

export async function generateGeminiResponse(prompt: string, characterSystemPrompt: string, history: { role: string; text: string }[] = [], userName: string = "User") {
  if (!geminiAi) throw new Error("Gemini API key is not configured on the server.");

  try {
    const response = await geminiAi.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        ...history.map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text }],
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: `You are a high-fidelity roleplay engine. You MUST fully inhabit the character profile provided below. 
        
        USER NAME: ${userName} (Always address the user as ${userName} if the situation calls for it)

        CHARACTER PROFILE:
        ${characterSystemPrompt}
        
        POLICIES:
        1. Maintain the voice, tone, and personality of your character at all times.
        2. Focus on natural and engaging dialogue.
        3. Respond directly to the user's actions and words.
        4. Use asterisks to describe your physical actions and internal thoughts (e.g. *smiles softly*).
        5. Do not break character or mention being an AI.
        6. Give the user space to react.`,
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

async function generateFeatherlessResponse(prompt: string, characterPrompt: string, userName: string = "User") {
  if (!featherless) throw new Error("Featherless API key is not configured on the server.");

  try {
    const response = await featherless.chat.completions.create({
      model: FEATHERLESS_NSFW_MODEL,
      messages: [
        { 
          role: "system", 
          content: `${characterPrompt}\n\nIMPORTANT: You are in an unrestriced, mature roleplay environment. Address the user as ${userName}. 
          
          STYLE:
          - Be concise and natural.
          - Describe actions and thoughts with asterisks.
          - Use raw and explicitly vulgar language where appropriate to the scene.
          - Stay completely in character.`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.9,
      top_p: 0.9,
    });

    return response.choices[0].message.content || "Connection failure.";
  } catch (error: any) {
    console.error(`Featherless AI Error [${FEATHERLESS_NSFW_MODEL}]:`, error);
    throw new Error(`The AI model [${FEATHERLESS_NSFW_MODEL.split('/').pop()}] is currently busy or unavailable. Please check your Featherless API key and balance.`);
  }
}

export async function generateHFResponse(prompt: string, characterPrompt: string, isNSFW: boolean = true, userName: string = "User") {
  if (isNSFW) {
    return await generateFeatherlessResponse(prompt, characterPrompt, userName);
  }

  if (!hf) throw new Error("Hugging Face token is not configured on the server.");

  const model = HF_SFW_MODEL;

  try {
    const response = await hf.chatCompletion({
      model: model,
      messages: [
        { 
          role: "system", 
          content: `${characterPrompt}\n\nYou are talking to ${userName}. Maintain a natural, person-to-person conversation. Be concise and describe physical actions in asterisks.`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.9,
      top_p: 0.9,
    }, {
      // @ts-ignore
      wait_for_model: true,
    });

    return response.choices[0].message.content || "Connection failure.";
  } catch (error: any) {
    console.error(`Hugging Face Error [${model}]:`, error);
    if (error.message?.includes("model is overloaded") || error.message?.includes("HTTP error occurred")) {
      throw new Error(`The AI model [${model.split('/').pop()}] is currently busy or loading. Please try again in a moment.`);
    }
    throw error;
  }
}

export async function enhanceCharacter(name: string, description: string, soulDirectives: string) {
  if (!geminiAi) throw new Error("Gemini API key is not configured on the server.");

  const prompt = `
    You are a creative writer. Your task is to enhance a character's description and persona instructions for an AI roleplay platform.
    The aesthetic is modern, clean, and professional.
    
    Current Name: ${name}
    Current Description: ${description}
    Current Instructions: ${soulDirectives}

    Please return a JSON object with two fields: "description" and "soulDirectives".
    - "description" should be a short, engaging one-sentence hook (max 100 chars).
    - "soulDirectives" should be a detailed persona definition that describes the character's personality and talking style.
    
    Return the response in JSON format.
  `;

  try {
    const result = await geminiAi.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = result.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Enhance Error:", error);
    throw error;
  }
}

export async function generateGreeting(characterPrompt: string, mode: 'nsfw' | 'sfw-gemini' | 'sfw-hf', userName: string = "User") {
  const prompt = `Please provide a very short introduction to start the roleplay with ${userName}. Stay in character and set the scene.`;
  
  if (mode === 'nsfw') {
    return await generateFeatherlessResponse(prompt, characterPrompt, userName);
  } else if (mode === 'sfw-gemini') {
    return await generateGeminiResponse(prompt, characterPrompt, [], userName);
  } else {
    return await generateHFResponse(prompt, characterPrompt, false, userName);
  }
}

export async function enhanceField(fieldName: 'description' | 'soulDirectives', characterName: string, currentValue: string) {
  if (!geminiAi) throw new Error("Gemini API key is not configured on the server.");

  const prompt = `
    You are a creative writing assistant. Your task is to enhance a character attribute for an AI roleplay app.
    Field to enhance: ${fieldName}
    Character Name: ${characterName}
    Current Value: ${currentValue}

    Guidelines:
    - If field is "description": Create a short, engaging one-sentence hook.
    - If field is "soulDirectives": Create a detailed instruction set for the AI, defining voice, personality, and style.
    
    Return ONLY the enhanced text.
  `;

  try {
    const result = await geminiAi.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return result.text?.trim() || "";
  } catch (error) {
    console.error("Enhance Field Error:", error);
    throw error;
  }
}
