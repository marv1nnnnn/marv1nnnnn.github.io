import type { APIRoute } from 'astro';
import OpenAI from 'openai';

export const POST: APIRoute = async ({ request }) => {
  // Initialize OpenAI client inside the handler to avoid build-time errors
  const openai = new OpenAI({
    apiKey: import.meta.env.OPENAI_API_KEY,
  });

  try {
    const body = await request.json();

    // Check if API key is actually available at runtime before proceeding
    if (!openai.apiKey) {
      throw new Error('OpenAI API key is missing.');
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: body.messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return new Response(
      JSON.stringify({
        message: completion.choices[0].message.content,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
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
