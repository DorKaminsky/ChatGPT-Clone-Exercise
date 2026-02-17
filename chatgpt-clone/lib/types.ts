// Data Source Types
export interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sample: any[];
}

export interface DataSchema {
  columns: DataColumn[];
  rowCount: number;
}

export interface ParsedData {
  id: string;
  fileName: string;
  schema: DataSchema;
  data: any[];
  preview: any[];
}

export interface DataSourceInfo {
  dataSourceId: string;
  fileName: string;
  schema: DataSchema;
  preview: any[];
}

// LLM Types
export interface QueryAnalysis {
  intent: string;
  dataNeeded: {
    columns: string[];
    filters?: any;
  };
  aggregation?: 'sum' | 'count' | 'average' | 'groupby' | 'none';
  needsVisualization: boolean;
}

export interface VisualizationSpec {
  type: 'bar' | 'pie' | 'line' | 'scatter' | 'table';
  reason: string;
  dataMapping: {
    xAxis?: string;
    yAxis?: string;
    nameField?: string;
    valueField?: string;
  };
}

export interface AIResponse {
  answer: string;
  visualization?: VisualizationSpec;
}

// Chart Types
export interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'scatter' | 'table';
  data: any[];
  config: {
    title?: string;
    xAxis?: string;
    yAxis?: string;
    labels?: string[];
  };
}

// API Response Types
export interface UploadResponse {
  dataSourceId: string;
  fileName: string;
  schema: DataSchema;
  preview: any[];
}

export interface ChatRequest {
  query: string;
  dataSourceId: string;
  conversationContext?: string[];
}

export interface ChatResponse {
  textResponse: string;
  visualization?: ChartData;
  error?: string;
}

// Message Types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  visualization?: ChartData;
  timestamp: Date;
}
