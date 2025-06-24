export async function generateGuideText(userPrompt) {
  const systemPrompt = `
  You are an expert assistant that writes clear, concise, step-by-step instructional guides.

When given a user prompt, respond with exactly:

- The first line is the title in the format: How to [user prompt], with no numbering.
- Followed by numbered steps starting from 1., each step on its own line.
- Steps should be brief, purely instructional, and contain no repeated numbering inside the steps.
- Do NOT include any introductions, summaries, or extra text.
- Use simple language, with each step clearly separated by a newline.
- If the user provides extra instructions (such as audience, style, tone, number of steps, or detail level), follow them exactly.

Example response for prompt "make a website for your business for free":

How to make a website for your business for free
1. Choose a free website builder platform like Wix or Weebly.
2. Sign up for a free account using your email.
3. Pick a template that fits your business type.
4. Customize your website using the drag-and-drop editor.
5. Add your business details, images, and contact information.
6. Use the free hosting provided by the website builder.
7. Preview your website to check its appearance and functionality.
8. Publish your website by clicking the publish button.
9. Share your website URL on social media and business listings.

Respond now with only the title line and numbered steps, nothing else.
  `;  

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.2-24b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    // NEW: Log response status for debugging
    console.log(`OpenRouter API status: ${response.status}`);
    
    const responseData = await response.json();
    
    // Handle OpenRouter API errors
    if (!response.ok || responseData.error) {
      // ENHANCED: More detailed error logging
      console.error('OpenRouter API error details:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData.error,
        headers: response.headers
      });
      
      const errorMessage = responseData.error?.message || 
                          `OpenRouter API error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    if (!responseData.choices?.[0]?.message?.content) {
      console.error('Unexpected API response structure:', responseData);
      throw new Error('Invalid response structure from OpenRouter API');
    }

    let content = responseData.choices[0].message.content;

    // Validate guide format
    if (!content.includes('\n') || !content.match(/^\d+\./m)) {
      // NEW: Log invalid content for debugging
      console.error('Invalid guide format. Content received:', content);
      throw new Error('Invalid guide format received from API');
    }

    return content;
  } catch (error) {
    console.error('Error in generateGuideText:', error);
    throw new Error(`Failed to generate guide: ${error.message}`);
  }
}

export async function generateExplanation(prompt) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.2-24b-instruct:free',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert assistant. Provide concise, clear explanations in paragraph format.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.5
      })
    });

    const responseData = await response.json();
    
    // Handle OpenRouter API errors
    if (!response.ok || responseData.error) {
      console.error('OpenRouter API error:', response.status, responseData);
      const errorMessage = responseData.error?.message || `OpenRouter API error: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    if (!responseData.choices?.[0]?.message?.content) {
      console.error('Unexpected API response structure:', responseData);
      throw new Error('Invalid response structure from OpenRouter API');
    }

    return responseData.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in generateExplanation:', error);
    throw new Error(`Failed to generate explanation: ${error.message}`);
  }
}