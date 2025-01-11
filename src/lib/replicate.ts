import Replicate from 'replicate';

const replicate = new Replicate({
  auth: import.meta.env.VITE_REPLICATE_API_TOKEN || 'r8_9W62FzrDBgkJzYeRtiSihDCdkcJLESS1owxJl',
});

export async function generateImage(prompt: string): Promise<string> {
  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: "low quality, blurry, distorted, disfigured, bad anatomy",
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 25,
          guidance_scale: 7.5,
          prompt_strength: 0.8,
        }
      }
    );

    if (Array.isArray(output) && output.length > 0) {
      return output[0] as string;
    }
    throw new Error('No image generated');
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}