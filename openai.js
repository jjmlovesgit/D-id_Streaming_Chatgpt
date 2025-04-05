export async function fetchOpenAIResponse(apiKey, userMessage) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{role: "user", content: userMessage}],
        temperature: 0.7,
        max_tokens: 100,  // Optimized for faster responses
        stream: false     // Disabled for better compatibility
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI error: ${errorData.error?.message || 'Unknown error'}`);
    }
    return (await response.json()).choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI Error:', error);
    return "I couldn't process that request. Please try again.";
  }
}