import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { DataSchema, QueryAnalysis, AIResponse } from './types.js';

// Zod schemas for validation
const QueryAnalysisSchema = z.object({
  intent: z.string(),
  dataNeeded: z.object({
    columns: z.array(z.string()),
    filters: z.any().optional(),
  }),
  aggregation: z.enum(['sum', 'count', 'average', 'groupby', 'none']).optional(),
  needsVisualization: z.boolean(),
});

const VisualizationSpecSchema = z.object({
  type: z.enum(['bar', 'pie', 'line', 'scatter', 'table']),
  reason: z.string(),
  dataMapping: z.object({
    xAxis: z.string().optional(),
    yAxis: z.string().optional(),
    nameField: z.string().optional(),
    valueField: z.string().optional(),
  }),
});

const AIResponseSchema = z.object({
  answer: z.string(),
  visualization: VisualizationSpecSchema.optional(),
});

export class LLMService {
  private client: Anthropic;
  private model = 'claude-3-5-sonnet-20241022'; // Using Claude 3.5 Sonnet (most capable available model)
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.client = new Anthropic({ apiKey: key });
  }

  /**
   * Phase 1: Analyze user query to understand intent and determine data requirements
   */
  async analyzeQuery(
    query: string,
    schema: DataSchema,
    preview: any[]
  ): Promise<QueryAnalysis> {
    const prompt = this.buildAnalysisPrompt(query, schema, preview);

    try {
      const response = await this.callLLMWithRetry(prompt, 'query_analysis');
      const jsonText = this.extractJSONFromResponse(response);
      const parsed = JSON.parse(jsonText);

      // Validate with Zod
      const validated = QueryAnalysisSchema.parse(parsed);
      return validated;
    } catch (error) {
      console.error('Error analyzing query:', error);
      throw new Error(`Failed to analyze query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Phase 2: Generate natural language response and determine visualization needs
   */
  async generateResponse(
    query: string,
    data: any[],
    schema: DataSchema
  ): Promise<AIResponse> {
    const prompt = this.buildResponsePrompt(query, data, schema);

    try {
      const response = await this.callLLMWithRetry(prompt, 'response_generation');
      const jsonText = this.extractJSONFromResponse(response);
      const parsed = JSON.parse(jsonText);

      // Validate with Zod
      const validated = AIResponseSchema.parse(parsed);
      return validated;
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build prompt for query analysis (Phase 1)
   */
  private buildAnalysisPrompt(
    query: string,
    schema: DataSchema,
    preview: any[]
  ): string {
    const schemaDescription = schema.columns
      .map(col => `- ${col.name} (${col.type}): Sample values: ${col.sample.slice(0, 3).join(', ')}`)
      .join('\n');

    const previewData = preview.slice(0, 5).map(row => JSON.stringify(row)).join('\n');

    return `You are a data analysis assistant. A user has asked a question about their dataset. Your task is to analyze the query and determine what data is needed to answer it.

**Dataset Schema:**
${schemaDescription}

**Sample Data (first 5 rows):**
${previewData}

**User Query:**
"${query}"

**Your Task:**
Analyze this query and return a JSON object with the following structure:

{
  "intent": "Brief description of what the user wants to know",
  "dataNeeded": {
    "columns": ["array", "of", "column", "names", "needed"],
    "filters": {
      "columnName": "filter criteria if needed (e.g., > 1000, contains 'text')"
    }
  },
  "aggregation": "sum|count|average|groupby|none",
  "needsVisualization": true or false
}

**Guidelines:**
- "intent": Summarize what the user wants in one sentence
- "dataNeeded.columns": List only the columns needed to answer the query
- "dataNeeded.filters": Include any filtering conditions (optional). Use simple expressions.
- "aggregation": Choose the appropriate aggregation method
  - "sum": When totaling numeric values
  - "count": When counting occurrences
  - "average": When calculating means
  - "groupby": When grouping by categories and aggregating
  - "none": When no aggregation is needed (raw data queries)
- "needsVisualization": true if a chart would help answer the question, false for simple text answers

**Examples:**
- "Which product sold the most?" → aggregation: "groupby", needsVisualization: true
- "What's the average revenue?" → aggregation: "average", needsVisualization: false
- "Show me orders above $1000" → aggregation: "none", needsVisualization: false
- "Sales by region" → aggregation: "groupby", needsVisualization: true

Return ONLY valid JSON, no additional text or markdown formatting.`;
  }

  /**
   * Build prompt for response generation (Phase 2)
   */
  private buildResponsePrompt(
    query: string,
    data: any[],
    schema: DataSchema
  ): string {
    const dataPreview = data.slice(0, 20).map(row => JSON.stringify(row)).join('\n');
    const dataCount = data.length;
    const columnNames = schema.columns.map(col => col.name).join(', ');

    return `You are a data analysis assistant. A user asked a question about their dataset, and you have the relevant data to answer it.

**User Query:**
"${query}"

**Available Columns:**
${columnNames}

**Query Results (${dataCount} rows${dataCount > 20 ? ', showing first 20' : ''}):**
${dataPreview}

**Your Task:**
Generate a natural language answer to the user's query and determine if a visualization would help.

Return a JSON object with this structure:

{
  "answer": "Your natural language answer here",
  "visualization": {
    "type": "bar|pie|line|scatter|table",
    "reason": "Brief explanation of why this visualization type is appropriate",
    "dataMapping": {
      "xAxis": "column name for x-axis",
      "yAxis": "column name for y-axis",
      "nameField": "column name for labels (pie charts)",
      "valueField": "column name for values (pie charts)"
    }
  }
}

**Guidelines for "answer":**
- Be conversational and natural
- Directly answer the user's question
- Include specific numbers and insights from the data
- Keep it concise (2-4 sentences)
- If no data matches, explain why clearly

**Guidelines for "visualization":**
- Only include if a chart would add value
- Choose the appropriate chart type:
  - "bar": For comparing categories (e.g., sales by product)
  - "pie": For showing proportions/percentages (e.g., market share)
  - "line": For trends over time (e.g., monthly revenue)
  - "scatter": For correlations between two numeric variables
  - "table": For detailed data that doesn't fit other types
- In "dataMapping":
  - For bar/line charts: specify xAxis and yAxis
  - For pie charts: specify nameField (labels) and valueField (values)
  - Use actual column names from the data
- "reason": Explain in one sentence why this chart type is best

**Examples:**

For "Which product sold the most?":
{
  "answer": "Based on the data, Product A sold the most with 1,250 units, followed by Product B with 890 units.",
  "visualization": {
    "type": "bar",
    "reason": "A bar chart clearly compares sales quantities across products",
    "dataMapping": {
      "xAxis": "Product",
      "yAxis": "Units Sold"
    }
  }
}

For "What's the total revenue?":
{
  "answer": "The total revenue across all transactions is $127,450.",
}

Return ONLY valid JSON, no additional text or markdown formatting.`;
  }

  /**
   * Call Claude API with retry logic
   */
  private async callLLMWithRetry(
    prompt: string,
    context: string,
    retryCount = 0
  ): Promise<Anthropic.Messages.Message> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: 0.3, // Lower temperature for more consistent JSON output
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return response;
    } catch (error) {
      // Handle rate limits and transient errors with retry
      if (retryCount < this.maxRetries) {
        const isRetryable = this.isRetryableError(error);

        if (isRetryable) {
          console.warn(`Retry ${retryCount + 1}/${this.maxRetries} for ${context}...`);
          await this.sleep(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
          return this.callLLMWithRetry(prompt, context, retryCount + 1);
        }
      }

      throw error;
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof Anthropic.APIError) {
      // Retry on rate limits and server errors
      return error.status === 429 || error.status === 500 || error.status === 503;
    }
    return false;
  }

  /**
   * Extract text content from Claude response
   */
  private extractJSONFromResponse(response: Anthropic.Messages.Message): string {
    const textBlock = response.content.find(block => block.type === 'text');

    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in LLM response');
    }

    let text = textBlock.text.trim();

    // Remove markdown code blocks if present
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return text.trim();
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test method to verify API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say "OK" if you can hear me.',
          },
        ],
      });

      const textBlock = response.content.find(block => block.type === 'text');
      return textBlock !== undefined;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance (optional, can also instantiate as needed)
export function createLLMService(apiKey?: string): LLMService {
  return new LLMService(apiKey);
}
