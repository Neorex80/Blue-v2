const AIML_API_KEY = 'cff39da9d8a24cc18bdf1655380715ee';

const PROMPT_ENHANCERS = [
  'high quality',
  'detailed',
  'professional',
  '8k resolution',
  'masterpiece'
];

interface AIMLResponse {
  created: number;
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    // Enhance prompt for better results
    const enhancedPrompt = `${prompt}, ${PROMPT_ENHANCERS.join(', ')}`;

    const response = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        model: 'dall-e-3',
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data: AIMLResponse = await response.json();
    if (!data.data?.[0]?.url) {
      throw new Error('No image URL in response');
    }

    return data.data[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}