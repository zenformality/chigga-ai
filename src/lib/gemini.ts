// Chigga ai - Character AI platform
// Character AI chat platform featuring unfiltered NSFW and SFW roleplay with custom display names.

export const GEMINI_MODEL = "gemini-1.5-flash"; 

const API_ERROR_MSG = "Connection failed. Please check your network.";

export async function generateGeminiResponse(prompt: string, characterSystemPrompt: string, history: { role: string; text: string }[] = [], userName: string = "User") {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt: characterSystemPrompt, history, mode: 'sfw-gemini', userName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate response');
  }

  const data = await response.json();
  return data.response;
}

export async function generateGreeting(systemPrompt: string, mode: 'nsfw' | 'sfw-gemini' | 'sfw-hf', userName: string = "User") {
  const response = await fetch('/api/greeting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, mode, userName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate greeting');
  }

  const data = await response.json();
  return data.response;
}

export async function enhanceField(field: 'description' | 'soulDirectives', name: string, currentValue: string) {
  const response = await fetch('/api/enhance-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, name, currentValue }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to enhance field');
  }

  const data = await response.json();
  return data.result;
}
