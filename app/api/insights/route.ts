import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { DataSchema } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { schema, preview, dataSourceId } = await request.json();

    if (!schema || !preview) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate insights using Claude
    const insights = await generateInsights(schema, preview);

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('Insights generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

async function generateInsights(schema: DataSchema, preview: any[]): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Analyze this dataset and provide 3-5 key insights in a concise format.

Dataset Schema:
- Total rows: ${schema.rowCount}
- Columns: ${schema.columns.map(c => `${c.name} (${c.type})`).join(', ')}

Sample Data (first ${preview.length} rows):
${JSON.stringify(preview, null, 2)}

Provide insights about:
1. Data quality (missing values, data distribution)
2. Interesting patterns or trends you notice
3. Potential analysis opportunities
4. Any data issues or concerns

Format each insight as: "Title: Description" (one per line, max 3-5 insights)
Be specific and actionable. Focus on what makes this dataset interesting or useful.`;

  // The API key determines which model is available
  // Try the models in order of preference
  const models = [
    'claude-sonnet-4-5',
    'claude-3-5-sonnet-20241022',
    'claude-opus-4-6',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307',
  ];

  for (const model of models) {
    try {
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      return textContent ? textContent.text : '';
    } catch (error: any) {
      // If model not available, try next one
      if (error.message?.includes('not available') || error.message?.includes('ModelNotFoundError')) {
        console.log(`Model ${model} not available, trying next...`);
        continue;
      }
      // For other errors, throw immediately
      throw error;
    }
  }

  // If all models failed, throw error
  throw new Error('No available Claude models found');
}
