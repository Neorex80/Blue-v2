import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function* streamWithGroq(
  message: string, 
  modelId: string = 'mixtral-8x7b-32768',
  signal?: AbortSignal,
  previousMessages: any[] = [],
  systemPrompt?: string
) {
  try {
    // Validate inputs
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    // Validate model ID
    const validModels = ['mixtral-8x7b-32768', 'llama-3.1-70b-versatile', 'gemma2-9b-it'];
    const finalModelId = validModels.includes(modelId) ? modelId : 'mixtral-8x7b-32768';

    // Format messages for chat completion
    const formattedMessages = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add system prompt if provided
    const messages = [
      { 
        role: 'system', 
        content: systemPrompt || `You are Blue, an advanced AI assistant with a friendly, engaging, and knowledgeable personality. Your responses should be:

- Helpful and informative, providing accurate and well-structured information
- Conversational and natural, making users feel comfortable
- Clear and concise, while being thorough when needed
- Professional yet approachable, using a friendly tone
- Proactive in suggesting relevant follow-up questions or related topics
- Honest about limitations, admitting when you're not sure about something
- Respectful of user privacy and ethical boundaries

You have access to multiple AI models and can analyze images. You aim to make every interaction meaningful and helpful while maintaining a warm, engaging presence.`
      },
      ...formattedMessages
    ];

    // Regular text chat
    try {
      messages.push({ role: 'user', content: message });

      const stream = await groq.chat.completions.create({
        messages,
        model: finalModelId,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      });

      let buffer = '';
      for await (const chunk of stream) {
        if (signal?.aborted) {
          throw new Error('Generation stopped by user');
        }
        
        const content = chunk.choices[0]?.delta?.content || '';
        buffer += content;
        
        if (content.includes(' ') || content.includes('\n') || buffer.length > 3) {
          yield buffer;
          buffer = '';
          await delay(30);
        }
      }
      
      if (buffer) {
        yield buffer;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error;
      }
      
      const errorMessage = error.error?.message || error.message || 'An error occurred';
      console.error('Chat API Error:', errorMessage);
      throw new Error(`Failed to generate response: ${errorMessage}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}