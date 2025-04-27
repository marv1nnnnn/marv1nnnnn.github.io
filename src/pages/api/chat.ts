import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const POST: APIRoute = async ({ request }) => {
  // Initialize Gemini client inside the handler to avoid build-time errors
  const genAI = new GoogleGenerativeAI(import.meta.env.GOOGLE_API_KEY);

  try {
    const body = await request.json();

    // Check if API key is actually available at runtime before proceeding
    if (!genAI.apiKey) {
      throw new Error('Google API key is missing.');
    }

    // Convert OpenAI messages format to Gemini format
    // OpenAI: [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
    // Gemini: [{ role: 'user', parts: [{ text: '...' }] }, { role: 'model', parts: [{ text: '...' }] }]
    const geminiMessages = body.messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }],
    }));

    // For the first message, Gemini expects the role to be 'user'
    if (geminiMessages.length > 0 && geminiMessages[0].role === 'model') {
        geminiMessages[0].role = 'user';
    }


    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent({
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const responseText = result.response.text();

    return new Response(
      JSON.stringify({
        message: responseText,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating response:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate response',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
