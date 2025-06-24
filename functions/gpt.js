// REMOVE node-fetch import - Node.js 20 has native fetch
async function generateGuideText(apiKey, userPrompt, signal) {
  const systemPrompt = `You are an expert assistant that writes clear, concise, step-by-step instructional guides.`;
  
  try {
    console.log("Sending request to OpenRouter API");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-small-3.2-24b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
      signal
    });

    console.log(`OpenRouter response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status} - ${errorText}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenRouter Error:", error);
    throw new Error(`Failed to generate guide: ${error.message}`);
  }
}

async function generateExplanation(apiKey, prompt) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-small-3.2-24b-instruct:free",
        messages: [
          { role: "system", content: "Provide concise explanations in one paragraph" },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Explanation Error:", error);
    throw new Error(`Failed to generate explanation: ${error.message}`);
  }
}

module.exports = { generateGuideText, generateExplanation };