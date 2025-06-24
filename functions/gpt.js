// Token counter helper
function countTokens(text) {
  // Simple approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

async function generateGuideText(apiKey, userPrompt, signal) {
  const systemPrompt = `You are an expert instructional designer creating step-by-step guides. 
  Format your response EXACTLY as follows:
  1. First line: Guide title
  2. Subsequent lines: Numbered steps (1., 2., 3., ...)
  3. Each step should:
    - Be concise yet complete
    - Use plain text only (NO markdown, asterisks, or bold)
    - Maintain consistent depth throughout
    
  Structure guide content based on these principles:
  - Audience level: Adjust complexity
  - Detail level: Vary explanation depth
  - Tone: Match requested style
  - Steps: Provide logical progression`;
  
  try {
    console.log(`[Guide Generation] Input tokens: ~${countTokens(systemPrompt + userPrompt)}`);
    
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error("Invalid response structure from DeepSeek API");
    }
    
    console.log(`[Guide Generation] Output tokens: ~${countTokens(data.choices[0].message.content)}`);
    if (data.usage) {
      console.log(`[Guide Generation] Actual token usage: ${data.usage.total_tokens}`);
    }
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("DeepSeek Error:", error);
    throw new Error(`Failed to generate guide: ${error.message}`);
  }
}

async function generateExplanation(apiKey, prompt) {
  try {
    console.log(`[Explanation] Input tokens: ~${countTokens(prompt)}`);
    
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: "Provide concise, beginner-friendly explanations in one paragraph. Use simple analogies when helpful." 
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error("Invalid explanation response structure");
    }
    
    console.log(`[Explanation] Output tokens: ~${countTokens(data.choices[0].message.content)}`);
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Explanation Error:", error);
    throw new Error(`Failed to generate explanation: ${error.message}`);
  }
}

module.exports = { generateGuideText, generateExplanation };