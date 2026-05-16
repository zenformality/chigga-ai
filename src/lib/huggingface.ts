export async function generateHFResponse(prompt: string, characterPrompt: string, isNSFW: boolean = true, userName: string = "User") {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt: characterPrompt, mode: isNSFW ? 'nsfw' : 'sfw-hf', userName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate response');
  }

  const data = await response.json();
  return data.response;
}
