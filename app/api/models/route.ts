import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ModelInfo } from '@/lib/types';

// Define known Claude models to test
const KNOWN_MODELS = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    description: 'Latest Sonnet model - balanced performance and speed',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Previous Sonnet version - reliable and fast',
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    description: 'Most capable model - best for complex reasoning',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Previous Opus version - powerful reasoning',
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Fastest model - great for simple queries',
  },
];

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });
    const availableModels: ModelInfo[] = [];

    // Test each model with a minimal request
    for (const model of KNOWN_MODELS) {
      try {
        await client.messages.create({
          model: model.id,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        });

        // If no error, model is available
        availableModels.push(model);
      } catch (error) {
        // Model not available, skip it
        console.log(`Model ${model.id} not available`);
      }
    }

    // Default to Claude Sonnet 4.5 if available, otherwise first available
    const defaultModel = availableModels.find(m => m.id === 'claude-sonnet-4-5') || availableModels[0];

    return NextResponse.json({
      models: availableModels,
      defaultModel: defaultModel?.id,
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available models' },
      { status: 500 }
    );
  }
}
