import { Brain, Cpu, Sparkles } from 'lucide-react';

export const models = [
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    description: 'Most capable model, best for complex tasks',
    icon: Brain,
    contextWindow: '32k',
    speed: 'Fast',
    provider: 'Mistral AI'
  },
  {
    id: 'llama-3.1-70b-versatile',
    name: 'LLaMA3 70B',
    description: 'Balanced performance and efficiency',
    icon: Cpu,
    contextWindow: '32k',
    speed: 'Medium',
    provider: 'Meta'
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma2 9B',
    description: 'Fast and efficient model',
    icon: Sparkles,
    contextWindow: '8k',
    speed: 'Fast',
    provider: 'Google'
  }
] as const;